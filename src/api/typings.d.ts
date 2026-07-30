declare namespace API {
  type adminCancelParams = {
    id: number;
  };

  type adminListParams = {
    pageNum?: number;
    pageSize?: number;
    status?: string;
  };

  type BaseResponseBoolean = {
    code?: number;
    data?: boolean;
    message?: string;
  };

  type BaseResponseChatHistory = {
    code?: number;
    data?: ChatHistory;
    message?: string;
  };

  type BaseResponseDashboardVO = {
    code?: number;
    data?: DashboardVO;
    message?: string;
  };

  type BaseResponseFilm = {
    code?: number;
    data?: Film;
    message?: string;
  };

  type BaseResponseInteger = {
    code?: number;
    data?: number;
    message?: string;
  };

  type BaseResponseListChatHistory = {
    code?: number;
    data?: ChatHistory[];
    message?: string;
  };

  type BaseResponseListFilm = {
    code?: number;
    data?: Film[];
    message?: string;
  };

  type BaseResponseListHall = {
    code?: number;
    data?: Hall[];
    message?: string;
  };

  type BaseResponseListSchedule = {
    code?: number;
    data?: Schedule[];
    message?: string;
  };

  type BaseResponseListScheduleVO = {
    code?: number;
    data?: ScheduleVO[];
    message?: string;
  };

  type BaseResponseListSeat = {
    code?: number;
    data?: Seat[];
    message?: string;
  };

  type BaseResponseLoginUserVO = {
    code?: number;
    data?: LoginUserVO;
    message?: string;
  };

  type BaseResponseLong = {
    code?: number;
    data?: number;
    message?: string;
  };

  type BaseResponseOrderVO = {
    code?: number;
    data?: OrderVO;
    message?: string;
  };

  type BaseResponsePageChatHistory = {
    code?: number;
    data?: PageChatHistory;
    message?: string;
  };

  type BaseResponsePageFilm = {
    code?: number;
    data?: PageFilm;
    message?: string;
  };

  type BaseResponsePageOrder = {
    code?: number;
    data?: PageOrder;
    message?: string;
  };

  type BaseResponsePageOrderVO = {
    code?: number;
    data?: PageOrderVO;
    message?: string;
  };

  type BaseResponsePageSchedule = {
    code?: number;
    data?: PageSchedule;
    message?: string;
  };

  type BaseResponsePageSeat = {
    code?: number;
    data?: PageSeat;
    message?: string;
  };

  type BaseResponsePageUserVO = {
    code?: number;
    data?: PageUserVO;
    message?: string;
  };

  type BaseResponsePayOrderVO = {
    code?: number;
    data?: PayOrderVO;
    message?: string;
  };

  type BaseResponseSchedule = {
    code?: number;
    data?: Schedule;
    message?: string;
  };

  type BaseResponseSeat = {
    code?: number;
    data?: Seat;
    message?: string;
  };

  type BaseResponseSeatMapVO = {
    code?: number;
    data?: SeatMapVO;
    message?: string;
  };

  type BaseResponseString = {
    code?: number;
    data?: string;
    message?: string;
  };

  type BaseResponseSystemConfig = {
    code?: number;
    data?: SystemConfig;
    message?: string;
  };

  type BaseResponseUser = {
    code?: number;
    data?: User;
    message?: string;
  };

  type BaseResponseUserVO = {
    code?: number;
    data?: UserVO;
    message?: string;
  };

  type ChatHistory = {
    id?: number;
    message?: string;
    messageType?: string;
    sessionId?: number;
    userId?: number;
    createTime?: string;
    updateTime?: string;
    isDelete?: number;
  };

  type ChatHistoryQueryRequest = {
    pageNum?: number;
    pageSize?: number;
    sortField?: string;
    sortOrder?: string;
    id?: number;
    sessionId?: number;
    messageType?: string;
    userId?: number;
  };

  type ChatSession = {
    id?: number;
    sessionName?: string;
    userId?: number;
    editTime?: string;
    createTime?: string;
    updateTime?: string;
    isDelete?: number;
  };

  type Cinema = {
    id?: number;
    name?: string;
    address?: string;
    city?: string;
    longitude?: number;
    latitude?: number;
    phone?: string;
    businessHours?: string;
    tags?: string;
    basePrice?: number;
    status?: string;
    isDelete?: boolean;
    createTime?: string;
    updateTime?: string;
  };

  type ConflictCheckRequest = {
    hallId?: number;
    showDate?: string;
    startTime?: string;
    endTime?: string;
    excludeScheduleId?: number;
  };

  type CreateOrderRequest = {
    scheduleId?: number;
    seatIds?: number[];
  };

  type DashboardVO = {
    todayOrders?: number;
    todayRevenue?: number;
    totalFilms?: number;
    totalCinemas?: number;
    totalUsers?: number;
    todaySchedules?: number;
  };

  type DeleteRequest = {
    id?: number;
  };

  type doChatParams = {
    message: string;
    conversationId: string;
  };

  type doChatStreamParams = {
    message: string;
    conversationId: string;
  };

  type Film = {
    id?: number;
    name?: string;
    englishName?: string;
    type?: string;
    rating?: number;
    duration?: number;
    posterUrl?: string;
    releaseDate?: string;
    director?: string;
    actors?: string;
    description?: string;
    status?: string;
    isDelete?: boolean;
    createTime?: string;
    updateTime?: string;
  };

  type FilmQueryRequest = {
    pageNum?: number;
    pageSize?: number;
    sortField?: string;
    sortOrder?: string;
    keyword?: string;
    type?: string;
    status?: string;
  };

  type getByKeyParams = {
    configKey: string;
  };

  type getFilmParams = {
    id: number;
  };

  type getInfo1Params = {
    id: number;
  };

  type getInfo2Params = {
    id: number;
  };

  type getInfo3Params = {
    id: number;
  };

  type getInfo4Params = {
    id: number;
  };

  type getInfo5Params = {
    id: number;
  };

  type getInfo6Params = {
    id: number;
  };

  type getInfo7Params = {
    id: number;
  };

  type getInfo8Params = {
    id: number;
  };

  type getInfo9Params = {
    id: number;
  };

  type getInfoParams = {
    id: number;
  };

  type getOrderDetailParams = {
    id: number;
  };

  type getSeatMapParams = {
    scheduleId: number;
  };

  type getUserByIdParams = {
    id: number;
  };

  type getUserVOByIdParams = {
    id: number;
  };

  type Hall = {
    id?: number;
    cinemaId?: number;
    name?: string;
    hallType?: string;
    rowCount?: number;
    colCount?: number;
    seatTemplate?: string;
    isDelete?: boolean;
    createTime?: string;
    updateTime?: string;
  };

  type listByCinemaParams = {
    cinemaId: number;
  };

  type listBySessionParams = {
    sessionId: number;
  };

  type listFilmParams = {
    filmQueryRequest: FilmQueryRequest;
  };

  type listOrdersParams = {
    pageNum?: number;
    pageSize?: number;
  };

  type listScheduleParams = {
    filmId: number;
    cinemaId?: number;
    showDate?: string;
  };

  type LockSeatRequest = {
    scheduleId?: number;
    seatIds?: number[];
  };

  type LoginUserVO = {
    id?: number;
    userAccount?: string;
    userName?: string;
    userAvatar?: string;
    userProfile?: string;
    userRole?: string;
    createTime?: string;
    updateTime?: string;
  };

  type Order = {
    id?: number;
    orderNo?: string;
    userId?: number;
    scheduleId?: number;
    filmName?: string;
    cinemaName?: string;
    scheduleTime?: string;
    hallname?: string;
    totalPrice?: number;
    count?: number;
    status?: string;
    cancelReason?: string;
    alipayTradeNo?: string;
    alipayStatus?: string;
    paidAt?: string;
    expireAt?: string;
    isDelete?: number;
    createTime?: string;
    updateTime?: string;
  };

  type OrderSeat = {
    id?: number;
    orderId?: number;
    seatId?: number;
    seatLabel?: string;
    isUsed?: boolean;
    isDelete?: boolean;
    createTime?: string;
    updateTime?: string;
  };

  type OrderVO = {
    id?: number;
    orderNo?: string;
    userId?: number;
    scheduleId?: number;
    filmName?: string;
    cinemaName?: string;
    scheduleTime?: string;
    hallName?: string;
    totalPrice?: number;
    count?: number;
    status?: string;
    cancelReason?: string;
    paidAt?: string;
    expireAt?: string;
    createTime?: string;
    seatLabels?: string[];
  };

  type page4Params = {
    page: PageUserPreference;
  };

  type page5Params = {
    page: PageSystemConfig;
  };

  type page6Params = {
    page: PageOrderSeat;
  };

  type page7Params = {
    page: PageHall;
  };

  type page8Params = {
    page: PageCinema;
  };

  type page9Params = {
    page: PageChatSession;
  };

  type PageChatHistory = {
    records?: ChatHistory[];
    pageNumber?: number;
    pageSize?: number;
    totalPage?: number;
    totalRow?: number;
    optimizeCountQuery?: boolean;
  };

  type PageChatSession = {
    records?: ChatSession[];
    pageNumber?: number;
    pageSize?: number;
    totalPage?: number;
    totalRow?: number;
    optimizeCountQuery?: boolean;
  };

  type PageCinema = {
    records?: Cinema[];
    pageNumber?: number;
    pageSize?: number;
    totalPage?: number;
    totalRow?: number;
    optimizeCountQuery?: boolean;
  };

  type PageFilm = {
    records?: Film[];
    pageNumber?: number;
    pageSize?: number;
    totalPage?: number;
    totalRow?: number;
    optimizeCountQuery?: boolean;
  };

  type PageHall = {
    records?: Hall[];
    pageNumber?: number;
    pageSize?: number;
    totalPage?: number;
    totalRow?: number;
    optimizeCountQuery?: boolean;
  };

  type PageOrder = {
    records?: Order[];
    pageNumber?: number;
    pageSize?: number;
    totalPage?: number;
    totalRow?: number;
    optimizeCountQuery?: boolean;
  };

  type PageOrderSeat = {
    records?: OrderSeat[];
    pageNumber?: number;
    pageSize?: number;
    totalPage?: number;
    totalRow?: number;
    optimizeCountQuery?: boolean;
  };

  type PageOrderVO = {
    records?: OrderVO[];
    pageNumber?: number;
    pageSize?: number;
    totalPage?: number;
    totalRow?: number;
    optimizeCountQuery?: boolean;
  };

  type PageSchedule = {
    records?: Schedule[];
    pageNumber?: number;
    pageSize?: number;
    totalPage?: number;
    totalRow?: number;
    optimizeCountQuery?: boolean;
  };

  type PageSeat = {
    records?: Seat[];
    pageNumber?: number;
    pageSize?: number;
    totalPage?: number;
    totalRow?: number;
    optimizeCountQuery?: boolean;
  };

  type PageSystemConfig = {
    records?: SystemConfig[];
    pageNumber?: number;
    pageSize?: number;
    totalPage?: number;
    totalRow?: number;
    optimizeCountQuery?: boolean;
  };

  type PageUserPreference = {
    records?: UserPreference[];
    pageNumber?: number;
    pageSize?: number;
    totalPage?: number;
    totalRow?: number;
    optimizeCountQuery?: boolean;
  };

  type PageUserVO = {
    records?: UserVO[];
    pageNumber?: number;
    pageSize?: number;
    totalPage?: number;
    totalRow?: number;
    optimizeCountQuery?: boolean;
  };

  type PayOrderRequest = {
    orderId?: number;
  };

  type PayOrderVO = {
    payForm?: string;
    orderNo?: string;
  };

  type remove1Params = {
    id: number;
  };

  type remove2Params = {
    id: number;
  };

  type remove3Params = {
    id: number;
  };

  type remove4Params = {
    id: number;
  };

  type remove5Params = {
    id: number;
  };

  type remove6Params = {
    id: number;
  };

  type remove7Params = {
    id: number;
  };

  type remove8Params = {
    id: number;
  };

  type remove9Params = {
    id: number;
  };

  type removeParams = {
    id: number;
  };

  type Schedule = {
    id?: number;
    filmId?: number;
    cinemaId?: number;
    hallId?: number;
    showDate?: string;
    startTime?: string;
    endTime?: string;
    price?: number;
    vipPrice?: number;
    status?: string;
    isDelete?: boolean;
    createTime?: string;
    updateTime?: string;
  };

  type ScheduleVO = {
    id?: number;
    filmId?: number;
    cinemaId?: number;
    hallId?: number;
    showDate?: string;
    startTime?: string;
    endTime?: string;
    price?: number;
    vipPrice?: number;
    status?: string;
    filmName?: string;
    filmPoster?: string;
    filmDuration?: number;
    filmRating?: string;
    filmType?: string;
    cinemaName?: string;
    cinemaAddress?: string;
    hallName?: string;
    hallType?: string;
    hallRowCount?: number;
    hallColCount?: number;
  };

  type Seat = {
    id?: number;
    scheduleId?: number;
    hallId?: number;
    rowNum?: number;
    colNum?: number;
    seatLabel?: string;
    zone?: string;
    status?: string;
    isDelete?: boolean;
    createTime?: string;
    updateTime?: string;
  };

  type SeatMapVO = {
    hallId?: number;
    hallName?: string;
    hallType?: string;
    rowCount?: number;
    colCount?: number;
    scheduleId?: number;
    price?: number;
    vipPrice?: number;
    seats?: Seat[];
  };

  type SystemConfig = {
    id?: number;
    configKey?: string;
    configValue?: string;
    description?: string;
    isDelete?: boolean;
    createTime?: string;
    updateTime?: string;
  };

  type updateStatusParams = {
    id: number;
    status: string;
  };

  type uploadFileParams = {
    uploadFileRequest: UploadFileRequest;
  };

  type UploadFileRequest = {
    biz?: string;
  };

  type User = {
    id?: number;
    userAccount?: string;
    userPassword?: string;
    userName?: string;
    userAvatar?: string;
    userProfile?: string;
    userRole?: string;
    editTime?: string;
    createTime?: string;
    updateTime?: string;
    isDelete?: number;
  };

  type UserAddRequest = {
    userName?: string;
    userAccount?: string;
    userAvatar?: string;
    userProfile?: string;
    userRole?: string;
  };

  type UserPreference = {
    id?: number;
    userId?: number;
    preferredTypes?: string;
    preferredHallType?: string;
    budgetMax?: number;
    frequentCinemaId?: number;
    preferredSeatZone?: string;
    isDelete?: boolean;
    createTime?: string;
    updateTime?: string;
  };

  type UserQueryRequest = {
    pageNum?: number;
    pageSize?: number;
    sortField?: string;
    sortOrder?: string;
    id?: number;
    userName?: string;
    userAccount?: string;
    userProfile?: string;
    userRole?: string;
  };

  type UserRegisterRequest = {
    userAccount?: string;
    userPassword?: string;
    checkPassword?: string;
  };

  type UserUpdateRequest = {
    id?: number;
    userName?: string;
    userAvatar?: string;
    userProfile?: string;
    userRole?: string;
  };

  type UserVO = {
    id?: number;
    userAccount?: string;
    userName?: string;
    userAvatar?: string;
    userProfile?: string;
    userRole?: string;
    createTime?: string;
  };
}
