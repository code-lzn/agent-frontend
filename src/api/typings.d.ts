declare namespace API {
  type ApprovalActionRequest = {
    comment?: string;
    detailId?: number;
    targetUserId?: number;
  };

  type ApprovalDelegationVO = {
    businessTypes?: string;
    createTime?: string;
    delegateName?: string;
    delegatorName?: string;
    endDate?: string;
    id?: number;
    startDate?: string;
    status?: number;
  };

  type ApprovalDetailVO = {
    applicantName?: string;
    applyTime?: string;
    businessId?: number;
    businessType?: string;
    businessTypeText?: string;
    currentStep?: number;
    finishedAt?: string;
    nodeHistory?: NodeDetail[];
    recordId?: number;
    status?: string;
    statusText?: string;
    totalSteps?: number;
  };

  type ApprovalPendingVO = {
    applicantName?: string;
    applyTime?: string;
    businessId?: number;
    businessType?: string;
    businessTypeText?: string;
    currentNodeName?: string;
    detailId?: number;
    recordId?: number;
  };

  type ApprovalRequest = {
    comment?: string;
    id?: number;
    result?: number;
  };

  type AttendanceCalendarVO = {
    dailyStatus?: Record<string, any>;
    lateDays?: number;
    leaveDays?: number;
    makeupAvailableDates?: string[];
    missingDays?: number;
    month?: string;
    normalDays?: number;
  };

  type AttendanceVO = {
    attendanceDate?: string;
    id?: number;
    punchInTime?: string;
    punchInType?: number;
    punchOutTime?: string;
    punchOutType?: number;
    remark?: string;
    status?: number;
    statusText?: string;
  };

  type BaseResponseApprovalDetailVO_ = {
    code?: number;
    data?: ApprovalDetailVO;
    message?: string;
  };

  type BaseResponseAttendanceCalendarVO_ = {
    code?: number;
    data?: AttendanceCalendarVO;
    message?: string;
  };

  type BaseResponseAttendanceVO_ = {
    code?: number;
    data?: AttendanceVO;
    message?: string;
  };

  type BaseResponseBoolean_ = {
    code?: number;
    data?: boolean;
    message?: string;
  };

  type BaseResponseDepartmentMergeResultVO_ = {
    code?: number;
    data?: DepartmentMergeResultVO;
    message?: string;
  };

  type BaseResponseEmpProfileVO_ = {
    code?: number;
    data?: EmpProfileVO;
    message?: string;
  };

  type BaseResponseLeaveProgressVO_ = {
    code?: number;
    data?: LeaveProgressVO;
    message?: string;
  };

  type BaseResponseLeaveVO_ = {
    code?: number;
    data?: LeaveVO;
    message?: string;
  };

  type BaseResponseListApprovalDelegationVO_ = {
    code?: number;
    data?: ApprovalDelegationVO[];
    message?: string;
  };

  type BaseResponseListApprovalPendingVO_ = {
    code?: number;
    data?: ApprovalPendingVO[];
    message?: string;
  };

  type BaseResponseListAttendanceVO_ = {
    code?: number;
    data?: AttendanceVO[];
    message?: string;
  };

  type BaseResponseListDepartmentTreeVO_ = {
    code?: number;
    data?: DepartmentTreeVO[];
    message?: string;
  };

  type BaseResponseListLeaveVO_ = {
    code?: number;
    data?: LeaveVO[];
    message?: string;
  };

  type BaseResponseListLoginLogVO_ = {
    code?: number;
    data?: LoginLogVO[];
    message?: string;
  };

  type BaseResponseListMakeupPunchVO_ = {
    code?: number;
    data?: MakeupPunchVO[];
    message?: string;
  };

  type BaseResponseListPositionVO_ = {
    code?: number;
    data?: PositionVO[];
    message?: string;
  };

  type BaseResponseListSalarySlipVO_ = {
    code?: number;
    data?: SalarySlipVO[];
    message?: string;
  };

  type BaseResponseListSalaryTrendVO_ = {
    code?: number;
    data?: SalaryTrendVO[];
    message?: string;
  };

  type BaseResponseListSequenceLevelVO_ = {
    code?: number;
    data?: SequenceLevelVO[];
    message?: string;
  };

  type BaseResponseLoginUserVO_ = {
    code?: number;
    data?: LoginUserVO;
    message?: string;
  };

  type BaseResponseLong_ = {
    code?: number;
    data?: number;
    message?: string;
  };

  type BaseResponseMakeupPunchVO_ = {
    code?: number;
    data?: MakeupPunchVO;
    message?: string;
  };

  type BaseResponseMapStringLong_ = {
    code?: number;
    data?: Record<string, any>;
    message?: string;
  };

  type BaseResponsePageUser_ = {
    code?: number;
    data?: PageUser_;
    message?: string;
  };

  type BaseResponsePageUserVO_ = {
    code?: number;
    data?: PageUserVO_;
    message?: string;
  };

  type BaseResponseSalarySlipDetailVO_ = {
    code?: number;
    data?: SalarySlipDetailVO;
    message?: string;
  };

  type BaseResponseString_ = {
    code?: number;
    data?: string;
    message?: string;
  };

  type BaseResponseUser_ = {
    code?: number;
    data?: User;
    message?: string;
  };

  type BaseResponseUserVO_ = {
    code?: number;
    data?: UserVO;
    message?: string;
  };

  type BindPhoneRequest = {
    phone?: string;
  };

  type cancelDelegationUsingPOSTParams = {
    /** id */
    id: number;
  };

  type cancelUsingPOSTParams = {
    /** 请假ID */
    id: number;
  };

  type ChangePasswordRequest = {
    confirmPassword?: string;
    newPassword?: string;
    oldPassword?: string;
  };

  type DelegationRequest = {
    businessTypes?: string;
    delegateId?: number;
    endDate?: string;
    startDate?: string;
  };

  type DeleteRequest = {
    id?: number;
  };

  type DepartmentAddRequest = {
    code?: string;
    description?: string;
    managerId?: number;
    name?: string;
    parentId?: number;
    sortOrder?: number;
  };

  type DepartmentMergeRequest = {
    sourceDeptId?: number;
    targetDeptId?: number;
  };

  type DepartmentMergeResultVO = {
    transferredChildDepts?: number;
    transferredEmployees?: number;
  };

  type DepartmentTreeVO = {
    children?: DepartmentTreeVO[];
    code?: string;
    description?: string;
    employeeCount?: number;
    id?: number;
    managerId?: number;
    managerName?: string;
    name?: string;
    parentId?: number;
    sortOrder?: number;
  };

  type DepartmentUpdateRequest = {
    description?: string;
    id?: number;
    managerId?: number;
    name?: string;
    sortOrder?: number;
  };

  type EmpProfileUpdateRequest = {
    currentAddress?: string;
    email?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
  };

  type EmpProfileVO = {
    baseSalary?: number;
    createTime?: string;
    currentAddress?: string;
    departmentName?: string;
    editableFields?: string[];
    email?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    employeeName?: string;
    employeeNo?: string;
    employmentType?: string;
    gender?: number;
    hireDate?: string;
    hireType?: number;
    id?: number;
    idCard?: string;
    phone?: string;
    positionName?: string;
    status?: number;
    updateTime?: string;
  };

  type getApprovalDetailUsingGETParams = {
    /** recordId */
    recordId: number;
  };

  type getApprovalProgressUsingGETParams = {
    /** id */
    id: number;
  };

  type getCalendarUsingGETParams = {
    /** month */
    month: string;
  };

  type getMonthRecordsUsingGETParams = {
    /** month */
    month: string;
  };

  type getSalarySlipDetailUsingPOSTParams = {
    /** id */
    id: number;
  };

  type getUserByIdUsingGETParams = {
    /** id */
    id?: number;
  };

  type getUserVOByIdUsingGETParams = {
    /** id */
    id?: number;
  };

  type LeaveApplyRequest = {
    endDate?: string;
    leaveType?: number;
    reason?: string;
    startDate?: string;
  };

  type LeaveProgressVO = {
    leave?: LeaveVO;
    progressNodes?: ProgressNode[];
  };

  type LeaveVO = {
    approveComment?: string;
    approveTime?: string;
    approverId?: number;
    createTime?: string;
    employeeId?: number;
    employeeName?: string;
    endDate?: string;
    id?: number;
    leaveType?: number;
    leaveTypeText?: string;
    reason?: string;
    startDate?: string;
    status?: number;
    statusText?: string;
    totalDays?: number;
  };

  type listPositionsUsingGETParams = {
    /** departmentId */
    departmentId?: number;
    /** sequence */
    sequence?: number;
  };

  type LoginLogVO = {
    device?: string;
    failReason?: string;
    id?: number;
    ip?: string;
    isSuccess?: number;
    loginTime?: string;
    loginType?: number;
    loginTypeText?: string;
  };

  type LoginUserVO = {
    createTime?: string;
    id?: number;
    updateTime?: string;
    userAvatar?: string;
    userName?: string;
    userProfile?: string;
    userRole?: string;
  };

  type MakeupPunchApplyRequest = {
    punchDate?: string;
    punchTime?: string;
    punchType?: number;
    reason?: string;
  };

  type MakeupPunchVO = {
    approveComment?: string;
    approveTime?: string;
    approverId?: number;
    createTime?: string;
    employeeId?: number;
    employeeName?: string;
    id?: number;
    punchDate?: string;
    punchTime?: string;
    punchType?: number;
    punchTypeText?: string;
    reason?: string;
    status?: number;
    statusText?: string;
  };

  type MapStringLong_ = true;

  type NodeDetail = {
    action?: string;
    actionText?: string;
    approverName?: string;
    comment?: string;
    delegatedByName?: string;
    isDelegated?: number;
    nodeName?: string;
    operateTime?: string;
    stepOrder?: number;
  };

  type OrderItem = {
    asc?: boolean;
    column?: string;
  };

  type PageUser_ = {
    countId?: string;
    current?: number;
    maxLimit?: number;
    optimizeCountSql?: boolean;
    orders?: OrderItem[];
    pages?: number;
    records?: User[];
    searchCount?: boolean;
    size?: number;
    total?: number;
  };

  type PageUserVO_ = {
    countId?: string;
    current?: number;
    maxLimit?: number;
    optimizeCountSql?: boolean;
    orders?: OrderItem[];
    pages?: number;
    records?: UserVO[];
    searchCount?: boolean;
    size?: number;
    total?: number;
  };

  type PositionAddRequest = {
    defaultProbationMonths?: number;
    departmentId?: number;
    description?: string;
    levelMax?: string;
    levelMin?: string;
    name?: string;
    sequence?: number;
  };

  type PositionUpdateRequest = {
    defaultProbationMonths?: number;
    departmentId?: number;
    description?: string;
    id?: number;
    levelMax?: string;
    levelMin?: string;
    name?: string;
    sequence?: number;
  };

  type PositionVO = {
    createTime?: string;
    defaultProbationMonths?: number;
    departmentId?: number;
    departmentName?: string;
    description?: string;
    id?: number;
    levelMax?: string;
    levelMin?: string;
    levelRange?: string;
    name?: string;
    sequence?: number;
    sequenceName?: string;
  };

  type ProgressNode = {
    comment?: string;
    nodeName?: string;
    operateTime?: string;
    operatorName?: string;
    status?: number;
  };

  type PunchRequest = {
    location?: string;
    punchType?: number;
  };

  type SalarySlipDetailVO = {
    adjustReason?: string;
    allowance?: number;
    baseSalary?: number;
    employeeName?: string;
    employeeNo?: string;
    grossSalary?: number;
    housingFund?: number;
    id?: number;
    incomeTax?: number;
    lateDeduction?: number;
    leaveDeduction?: number;
    manualAdjust?: number;
    netSalary?: number;
    overtimePay?: number;
    performanceBonus?: number;
    salaryMonth?: string;
    socialMedical?: number;
    socialPension?: number;
    socialUnemployment?: number;
    totalDeduction?: number;
  };

  type SalarySlipVO = {
    batchStatus?: string;
    grossSalary?: number;
    hasAnomaly?: number;
    id?: number;
    netSalary?: number;
    salaryMonth?: string;
    totalDeduction?: number;
  };

  type SalaryTrendVO = {
    grossSalary?: number;
    month?: string;
    netSalary?: number;
  };

  type SequenceLevelVO = {
    levels?: string[];
    sequence?: number;
    sequenceCode?: string;
    sequenceName?: string;
  };

  type uploadFileUsingPOSTParams = {
    biz?: string;
  };

  type User = {
    createTime?: string;
    employeeId?: number;
    id?: number;
    isDelete?: number;
    roleId?: number;
    updateTime?: string;
    userAccount?: string;
    userAvatar?: string;
    userName?: string;
    userPassword?: string;
    userProfile?: string;
    userRole?: string;
  };

  type UserAddRequest = {
    userAccount?: string;
    userAvatar?: string;
    userName?: string;
    userRole?: string;
  };

  type UserLoginRequest = {
    userAccount?: string;
    userPassword?: string;
  };

  type UserQueryRequest = {
    current?: number;
    id?: number;
    mpOpenId?: string;
    pageSize?: number;
    sortField?: string;
    sortOrder?: string;
    unionId?: string;
    userName?: string;
    userProfile?: string;
    userRole?: string;
  };

  type UserRegisterRequest = {
    checkPassword?: string;
    userAccount?: string;
    userPassword?: string;
  };

  type UserUpdateMyRequest = {
    userAvatar?: string;
    userName?: string;
    userProfile?: string;
  };

  type UserUpdateRequest = {
    id?: number;
    userAvatar?: string;
    userName?: string;
    userProfile?: string;
    userRole?: string;
  };

  type UserVO = {
    createTime?: string;
    id?: number;
    userAvatar?: string;
    userName?: string;
    userProfile?: string;
    userRole?: string;
  };

  type VerifyPasswordRequest = {
    password?: string;
  };
}
