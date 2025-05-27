class DashboardService {
  async getDashboardData(request: DashboardRequest): Promise<any> {
    if (!request.fromDate || !request.toDate) {
      var date = new Date();

      var last60Days = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() - 60
      );

      request.fromDate = last60Days;
      request.toDate = date;
    }
  }
}
