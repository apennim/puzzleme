/**
 * 投票計數服務
 */

/**
 * 投票計數器
 */
export class VoteCounter {
  private votes: Map<string, number> = new Map();

  /**
   * 新增投票
   */
  addVote(routeId: string): void {
    const current = this.votes.get(routeId) || 0;
    this.votes.set(routeId, current + 1);
  }

  /**
   * 取得所有投票計數
   */
  getVotes(): Record<string, number> {
    const result: Record<string, number> = {};
    this.votes.forEach((count, routeId) => {
      result[routeId] = count;
    });
    return result;
  }

  /**
   * 檢查是否過半（>= 50%）
   */
  isPassThreshold(totalMembers: number, threshold: number = 0.5): boolean {
    let maxVotes = 0;
    this.votes.forEach((count) => {
      maxVotes = Math.max(maxVotes, count);
    });
    return maxVotes / totalMembers >= threshold;
  }

  /**
   * 取得最高票數的路線
   */
  getWinnerRoute(): string | null {
    let winner: string | null = null;
    let maxVotes = 0;

    this.votes.forEach((count, routeId) => {
      if (count > maxVotes) {
        maxVotes = count;
        winner = routeId;
      }
    });

    return winner;
  }

  /**
   * 重置投票
   */
  reset(): void {
    this.votes.clear();
  }
}
