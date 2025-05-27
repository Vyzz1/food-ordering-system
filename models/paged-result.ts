export class PagedResult<T> {
  content: T[] = [];
  totalCount: number;
  currentPage: number;
  pageSize: number;

  constructor(
    content: T[],
    totalCount: number,
    currentPage: number,
    pageSize: number
  ) {
    this.content = content;
    this.totalCount = Number(totalCount);
    this.currentPage = Number(currentPage);
    this.pageSize = Number(pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  get isFirst(): boolean {
    return this.currentPage === 0;
  }

  get isLast(): boolean {
    return this.currentPage === this.totalPages - 1 || this.totalCount === 0;
  }

  get isPrevious(): boolean {
    return this.currentPage > 0;
  }

  get isNext(): boolean {
    return this.currentPage < this.totalPages - 1 && this.totalCount > 0;
  }

  get response() {
    return {
      content: this.content,
      totalCount: this.totalCount,
      currentPage: this.currentPage,
      pageSize: this.pageSize,
      totalPages: this.totalPages,
      isFirst: this.isFirst,
      isLast: this.isLast,
      isPrevious: this.isPrevious,
      isNext: this.isNext,
    };
  }
}
