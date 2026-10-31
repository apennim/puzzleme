"""把 LINE Seed TW 轉成網頁用的分片字型（WOFF2 + unicode-range），輸出到 frontend/public/fonts/。

為什麼要分片：一個字重的完整中文字型約 3.4 MB，手機每次都下載太重。
分成很多小檔、每片用 unicode-range 標明涵蓋哪些字，瀏覽器只會下載畫面上有用到的那幾片
（Google Fonts 的中文字型也是這樣做）。

授權注意：LINE Seed TW 是 SIL OFL 1.1，且「LINE Seed TW」是保留字型名稱（Reserved Font Name）。
OFL 規定修改過的版本（分片就算修改）不能沿用保留名稱，所以這裡把字型改名為 PuzzleMe Sans TC，
保留 LY Corporation 的版權聲明，並一起附上 OFL 授權全文。

用法（需要 fonttools 與 brotli）：
    python scripts/build_chinese_webfont.py <LINE Seed TW 解壓縮後的資料夾>
可重複執行：每次都會清空輸出資料夾重新產生。
"""

import re
import shutil
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / 'frontend' / 'src'
OUT_DIR = ROOT / 'frontend' / 'public' / 'fonts' / 'puzzleme-sans-tc'

FAMILY = 'PuzzleMe Sans TC'
FILE_PREFIX = 'puzzleme-sans-tc'
WEIGHTS = [  # (原始檔名, CSS font-weight, 檔名用的字重)
    ('LINESeedTW_OTF_Rg.otf', 400, 'regular'),
    ('LINESeedTW_OTF_Bd.otf', 700, 'bold'),
]
CHUNK_SIZE = 600  # 每片大約幾個字

# 英數與常用標點：放在第 0 片，幾乎每個畫面都會用到
BASIC_RANGES = [
    (0x0020, 0x007E),  # ASCII
    (0x00A0, 0x00FF),  # Latin-1 補充
    (0x2000, 0x206F),  # 一般標點（— … ‧ 等）
    (0x3000, 0x303F),  # 中日韓標點（，。「」等）
    (0xFF00, 0xFFEF),  # 全形字元（！？：等）
]


def app_ui_characters() -> set[int]:
    """收集 App 原始碼裡出現的所有字（介面文字），放進第 0 片"""
    chars: set[int] = set()
    for path in list(SRC_DIR.rglob('*.ts')) + list(SRC_DIR.rglob('*.tsx')) + list(SRC_DIR.rglob('*.json')):
        chars.update(ord(c) for c in path.read_text(encoding='utf-8'))
    return chars


def to_unicode_range(codepoints: list[int]) -> str:
    """把一串 codepoint 壓成 CSS unicode-range（連續的合併成 U+XXXX-YYYY）"""
    parts = []
    start = prev = None
    for cp in sorted(codepoints):
        if start is None:
            start = prev = cp
        elif cp == prev + 1:
            prev = cp
        else:
            parts.append(f'U+{start:X}' if start == prev else f'U+{start:X}-{prev:X}')
            start = prev = cp
    if start is not None:
        parts.append(f'U+{start:X}' if start == prev else f'U+{start:X}-{prev:X}')
    return ', '.join(parts)


def rename_font(font: TTFont, weight_name: str) -> None:
    """依 OFL 保留名稱規定改名：家族名、全名、PostScript 名都換掉，版權（name ID 0）保留"""
    style = 'Regular' if weight_name == 'regular' else 'Bold'
    new_names = {
        1: FAMILY,
        2: style,
        3: f'{FAMILY.replace(" ", "")}-{style};subset-of-LINE-Seed-TW',
        4: f'{FAMILY} {style}',
        6: f'{FAMILY.replace(" ", "")}-{style}',
        16: FAMILY,
        17: style,
    }
    name_table = font['name']
    for record in list(name_table.names):
        if record.nameID in new_names:
            record.string = new_names[record.nameID]
    # 原檔可能有中文家族名（例如「LINE Seed TW」的在地化名稱），一律換成新名字
    for record in name_table.names:
        if record.nameID in (1, 4, 16) and 'LINE' in str(record.toUnicode()):
            record.string = new_names[record.nameID]


def build(src_folder: Path) -> None:
    otf_dir = src_folder / 'OTF'
    if OUT_DIR.exists():
        shutil.rmtree(OUT_DIR)
    OUT_DIR.mkdir(parents=True)

    # 字型實際有的字
    reference = TTFont(otf_dir / WEIGHTS[0][0])
    available = set(reference.getBestCmap().keys())
    reference.close()

    basic = {cp for lo, hi in BASIC_RANGES for cp in range(lo, hi + 1)}
    first = sorted((basic | app_ui_characters()) & available)
    rest = sorted(available - set(first))
    chunks = [first] + [rest[i : i + CHUNK_SIZE] for i in range(0, len(rest), CHUNK_SIZE)]

    css = [
        f'/* {FAMILY}：由 LINE Seed TW（© LY Corporation，SIL OFL 1.1）分片產生，授權見同資料夾 OFL.txt */',
        '/* 由 scripts/build_chinese_webfont.py 產生，請勿手動修改 */',
    ]
    total_bytes = 0
    for src_name, css_weight, weight_name in WEIGHTS:
        for index, chunk in enumerate(chunks):
            font = TTFont(otf_dir / src_name)
            options = subset.Options()
            options.flavor = 'woff2'
            options.layout_features = ['*']  # 保留直排、全形標點等 OpenType 功能
            options.name_IDs = ['*']
            options.name_languages = ['*']
            options.notdef_outline = True
            subsetter = subset.Subsetter(options)
            subsetter.populate(unicodes=chunk)
            subsetter.subset(font)
            rename_font(font, weight_name)
            file_name = f'{FILE_PREFIX}-{weight_name}-{index:02d}.woff2'
            font.flavor = 'woff2'
            font.save(OUT_DIR / file_name)
            font.close()
            total_bytes += (OUT_DIR / file_name).stat().st_size
            css.append(
                '@font-face {\n'
                f"  font-family: '{FAMILY}';\n"
                '  font-style: normal;\n'
                f'  font-weight: {css_weight};\n'
                '  font-display: swap;\n'
                f"  src: url('./{file_name}') format('woff2');\n"
                f'  unicode-range: {to_unicode_range(chunk)};\n'
                '}'
            )

    (OUT_DIR / 'fonts.css').write_text('\n\n'.join(css) + '\n', encoding='utf-8')
    shutil.copy(src_folder / 'license.txt', OUT_DIR / 'OFL.txt')

    first_sizes = [(OUT_DIR / f'{FILE_PREFIX}-{w}-00.woff2').stat().st_size for _, _, w in WEIGHTS]
    print(f'字數：{len(available)}，每個字重 {len(chunks)} 片（第 0 片 {len(first)} 字）')
    print(f'第 0 片大小：' + '、'.join(f'{s / 1024:.0f} KB' for s in first_sizes))
    print(f'全部檔案合計：{total_bytes / 1024 / 1024:.1f} MB（使用者只會下載用到的片）')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)
    folder = Path(sys.argv[1])
    if not (folder / 'OTF').is_dir() or not (folder / 'license.txt').is_file():
        sys.exit(f'找不到 OTF 資料夾或 license.txt：{folder}')
    build(folder)
