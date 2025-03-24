const useLogViewer = () => {
    const { ref, reactive, computed, watch, onMounted, onBeforeUnmount } = Vue;

    const state = reactive({
        logs: [],
        loading: false,
        error: null,
        selectedLog: null,
        logDetail: null,
        detailLoading: false,
        currentPage: 1,
        pageSize: 50,
        totalLogs: 0,
        totalPages: 1,
        sortBy: 'timestamp',
        sortDirection: 'desc',
        searchDebounce: null,
        baseUrl: window.location.origin,
        availableLevels: ['LOG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL', 'DEBUG'],
        filters: {
            level: '',
            startDate: '',
            endDate: '',
            search: ''
        },
        parsedContent: null,
        showStartCalendar: false,
        showEndCalendar: false,
        startCalendarMonth: new Date().getMonth(),
        startCalendarYear: new Date().getFullYear(),
        endCalendarMonth: new Date().getMonth(),
        endCalendarYear: new Date().getFullYear(),
        startHours: 0,
        startMinutes: 0,
        endHours: 23,
        endMinutes: 59,
        weekDays: [],
        monthNames: [],
        startCalendarDays: [],
        endCalendarDays: [],
        requiresAuthentication: false,
        isRootUser: false,
        authModalOpen: false
    });

    const processLogsResponse = (data) => {
        if (!data || !data.result) return [];

        if (typeof data.result === 'object' && !Array.isArray(data.result)) {
            return Object.values(data.result);
        }

        return data.result;
    };

    const formatTimestamp = (timestamp, detailed = false) => {
        if (!timestamp) return '';

        const date = new Date(timestamp);

        if (detailed) {
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
        }

        return date.toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    const getLevelClass = (level) => {
        if (!level) return 'bg-neutral-700 text-neutral-300';

        switch (level.toUpperCase()) {
            case 'ERROR':
            case 'CRITICAL':
                return 'bg-red-900/60 text-red-200';
            case 'WARNING':
                return 'bg-yellow-900/60 text-yellow-200';
            case 'INFO':
                return 'bg-blue-900/60 text-blue-200';
            case 'DEBUG':
                return 'bg-purple-900/60 text-purple-200';
            case 'LOG':
                return 'bg-green-900/60 text-green-200';
            default:
                return 'bg-neutral-700 text-neutral-300';
        }
    };

    const parseLogMessage = (message) => {
        if (!message) return null;

        const parsed = {};
        const regex = /(\w+)=(?:"([^"]*)"|(\S+))/g;
        let match;

        while ((match = regex.exec(message)) !== null) {
            const key = match[1];
            const value = match[2] || match[3];
            parsed[key] = value;
        }

        return Object.keys(parsed).length > 0 ? parsed : null;
    };

    function checkIfRootUser() {
        const storedAuth = localStorage.getItem('apiExplorerAuth');
        if (storedAuth) {
            try {
                const auth = JSON.parse(storedAuth);
                return auth.isRoot === true || auth.roles?.includes('admin');
            } catch (e) {
                return false;
            }
        }
        return false;
    }

    function getAuthToken() {
        const storedAuth = localStorage.getItem('apiExplorerAuth');
        if (storedAuth) {
            try {
                const auth = JSON.parse(storedAuth);
                state.isRootUser = auth.isRoot === true || auth.roles?.includes('admin');
                return auth.token ? `Bearer ${auth.token}` : '';
            } catch (e) {
                state.isRootUser = false;
                return '';
            }
        }
        state.isRootUser = false;
        return '';
    }

    const fetchLogs = async () => {
        try {
            state.loading = true;
            state.error = null;

            const queryParams = new URLSearchParams({
                limit: state.pageSize,
                offset: (state.currentPage - 1) * state.pageSize,
                sortBy: state.sortBy,
                sort: state.sortDirection
            });

            if (state.filters.level) {
                queryParams.append('level', state.filters.level);
            }

            if (state.filters.startDate) {
                const startTimestamp = new Date(state.filters.startDate).getTime();
                queryParams.append('startTime', startTimestamp);
            }

            if (state.filters.endDate) {
                const endTimestamp = new Date(state.filters.endDate).getTime();
                queryParams.append('endTime', endTimestamp);
            }

            if (state.filters.search) {
                queryParams.append('search', state.filters.search);
            }

            const url = `${state.baseUrl}/logs?${queryParams.toString()}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': getAuthToken()
                }
            });

            if (response.status === 401 || response.status === 403) {
                state.error = "Restricted Access: Administrator privileges required";
                state.logs = [];
                state.totalLogs = 0;
                state.totalPages = 1;
                return;
            }

            if (!response.ok) {
                throw new Error(`Erro ao buscar logs: ${response.statusText}`);
            }

            const data = await response.json();

            state.logs = processLogsResponse(data);
            state.totalLogs = data.total || data.count || state.logs.length;
            state.totalPages = Math.max(1, Math.ceil(state.totalLogs / state.pageSize));

            if (state.currentPage > state.totalPages) {
                state.currentPage = state.totalPages;
                await fetchLogs();
            }

            state.logs.forEach(log => {
                log.parsedContent = parseLogMessage(log.message);
            });

        } catch (error) {
            console.error('Error fetching logs:', error);
            state.error = error.message;
            state.logs = [];
        } finally {
            state.loading = false;
        }
    };

    const fetchLogDetail = async (logId) => {
        if (!logId) return;

        try {
            state.detailLoading = true;

            const url = `${state.baseUrl}/logs/${logId}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Error fetching log detail: ${response.statusText}`);
            }

            const data = await response.json();
            state.logDetail = data.result;

        } catch (error) {
            console.error('Error fetching log detail:', error);
            state.logDetail = null;
        } finally {
            state.detailLoading = false;
        }
    };

    const initializeCalendarLabels = () => {
        const userLocale = navigator.language || 'en-US';

        state.weekDays = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(2021, 0, 3 + i);
            return new Intl.DateTimeFormat(userLocale, { weekday: 'short' }).format(date);
        });

        state.monthNames = Array.from({ length: 12 }, (_, i) => {
            const date = new Date(2021, i, 1);
            return new Intl.DateTimeFormat(userLocale, { month: 'long' }).format(date);
        });
    };

    const yearRange = computed(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);
    });

    const generateCalendarDays = (year, month) => {
        const days = [];
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const firstDayOfWeek = firstDay.getDay();

        const prevMonthLastDay = new Date(year, month, 0).getDate();

        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const day = prevMonthLastDay - i;
            const date = new Date(year, month - 1, day);
            days.push({ day, date, isCurrentMonth: false });
        }

        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(year, month, day);
            days.push({ day, date, isCurrentMonth: true });
        }

        const remainingCells = 42 - days.length;
        for (let day = 1; day <= remainingCells; day++) {
            const date = new Date(year, month + 1, day);
            days.push({ day, date, isCurrentMonth: false });
        }

        return days;
    };

    const generateStartCalendarDays = () => {
        state.startCalendarDays = generateCalendarDays(
            state.startCalendarYear,
            state.startCalendarMonth
        );
    };

    const generateEndCalendarDays = () => {
        state.endCalendarDays = generateCalendarDays(
            state.endCalendarYear,
            state.endCalendarMonth
        );
    };

    const initializeDateRange = () => {
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);

        now.setHours(23, 59, 59, 999);
        state.filters.endDate = now.toISOString().slice(0, 16);
        state.endHours = now.getHours();
        state.endMinutes = now.getMinutes();

        yesterday.setHours(0, 0, 0, 0);
        state.filters.startDate = yesterday.toISOString().slice(0, 16);
        state.startHours = yesterday.getHours();
        state.startMinutes = yesterday.getMinutes();
    };

    const initialize = () => {
        initializeDateRange();
        initializeCalendarLabels();
        generateStartCalendarDays();
        generateEndCalendarDays();
        getAuthToken();
        setupAuthListener();
        listenForAuthChanges();
        fetchLogs();
    };

    initialize();

    const closeCalendar = (type) => {
        if (type === 'start') {
            state.showStartCalendar = false;
        } else if (type === 'end') {
            state.showEndCalendar = false;
        } else {
            state.showStartCalendar = false;
            state.showEndCalendar = false;
        }

        document.removeEventListener('click', handleClickOutside);
    };

    const handleClickOutside = (event) => {
        const startCalendar = document.querySelector('.start-calendar');
        const endCalendar = document.querySelector('.end-calendar');
        const startInput = document.querySelector('.start-date-input');
        const endInput = document.querySelector('.end-date-input');

        if (state.showStartCalendar && startCalendar && !startCalendar.contains(event.target) &&
            startInput && !startInput.contains(event.target)) {
            closeCalendar('start');
        }

        if (state.showEndCalendar && endCalendar && !endCalendar.contains(event.target) &&
            endInput && !endInput.contains(event.target)) {
            closeCalendar('end');
        }
    };

    const prevMonth = (type) => {
        if (type === 'start') {
            if (state.startCalendarMonth === 0) {
                state.startCalendarMonth = 11;
                state.startCalendarYear--;
            } else {
                state.startCalendarMonth--;
            }
            generateStartCalendarDays();
        } else if (type === 'end') {
            if (state.endCalendarMonth === 0) {
                state.endCalendarMonth = 11;
                state.endCalendarYear--;
            } else {
                state.endCalendarMonth--;
            }
            generateEndCalendarDays();
        }
    };

    const nextMonth = (type) => {
        if (type === 'start') {
            if (state.startCalendarMonth === 11) {
                state.startCalendarMonth = 0;
                state.startCalendarYear++;
            } else {
                state.startCalendarMonth++;
            }
            generateStartCalendarDays();
        } else if (type === 'end') {
            if (state.endCalendarMonth === 11) {
                state.endCalendarMonth = 0;
                state.endCalendarYear++;
            } else {
                state.endCalendarMonth++;
            }
            generateEndCalendarDays();
        }
    };

    const updateCalendar = (type) => {
        if (type === 'start') {
            generateStartCalendarDays();
        } else if (type === 'end') {
            generateEndCalendarDays();
        }
    };

    const isToday = (date) => {
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    const isSelectedStartDate = (date) => {
        if (!state.filters.startDate) return false;

        const startDate = new Date(state.filters.startDate);
        return (
            date.getDate() === startDate.getDate() &&
            date.getMonth() === startDate.getMonth() &&
            date.getFullYear() === startDate.getFullYear()
        );
    };

    const isSelectedEndDate = (date) => {
        if (!state.filters.endDate) return false;

        const endDate = new Date(state.filters.endDate);
        return (
            date.getDate() === endDate.getDate() &&
            date.getMonth() === endDate.getMonth() &&
            date.getFullYear() === endDate.getFullYear()
        );
    };

    const selectStartDate = (date) => {
        if (!date || !date.isCurrentMonth) return;

        const selectedDate = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            state.startHours,
            state.startMinutes,
            0
        );

        state.filters.startDate = selectedDate.toISOString().slice(0, 16);
        closeCalendar('start');
        applyFilters();
    };

    const selectEndDate = (date) => {
        if (!date || !date.isCurrentMonth) return;

        const selectedDate = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            state.endHours,
            state.endMinutes,
            59
        );

        state.filters.endDate = selectedDate.toISOString().slice(0, 16);
        closeCalendar('end');
        applyFilters();
    };

    const selectToday = (type) => {
        const today = new Date();

        if (type === 'start') {
            today.setHours(0, 0, 0, 0);
            state.filters.startDate = today.toISOString().slice(0, 16);
            closeCalendar('start');
        } else if (type === 'end') {
            today.setHours(23, 59, 59, 999);
            state.filters.endDate = today.toISOString().slice(0, 16);
            closeCalendar('end');
        }

        applyFilters();
    };

    const updateStartTime = () => {
        if (!state.filters.startDate) return;

        const date = new Date(state.filters.startDate);
        date.setHours(state.startHours, state.startMinutes, 0, 0);
        state.filters.startDate = date.toISOString().slice(0, 16);
    };

    const updateEndTime = () => {
        if (!state.filters.endDate) return;

        const date = new Date(state.filters.endDate);
        date.setHours(state.endHours, state.endMinutes, 59, 999);
        state.filters.endDate = date.toISOString().slice(0, 16);
    };

    const formatCalendarDate = (dateString) => {
        if (!dateString) return '';

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';

        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}`;
    };

    const refreshData = () => {
        fetchLogs();
    };

    const applyFilters = () => {
        state.currentPage = 1;
        fetchLogs();
    };

    const clearFilters = () => {
        state.filters = {
            level: '',
            startDate: '',
            endDate: '',
            search: ''
        };
        state.currentPage = 1;
        fetchLogs();
    };

    const handleSearchInput = () => {
        if (state.searchDebounce) {
            clearTimeout(state.searchDebounce);
        }

        state.searchDebounce = setTimeout(() => {
            state.currentPage = 1;
            fetchLogs();
        }, 300);
    };

    const goToPage = (page) => {
        if (page < 1 || page > state.totalPages) return;
        state.currentPage = page;
        fetchLogs();
    };

    const goToFirstPage = () => goToPage(1);
    const goToLastPage = () => goToPage(state.totalPages);
    const goToNextPage = () => goToPage(state.currentPage + 1);
    const goToPreviousPage = () => goToPage(state.currentPage - 1);

    const handlePageInputChange = (event) => {
        const page = parseInt(event.target.value, 10);
        if (!isNaN(page)) {
            const validPage = Math.min(Math.max(1, page), state.totalPages);
            state.currentPage = validPage;
            fetchLogs();
        }
    };

    const handlePageSizeChange = () => {
        state.currentPage = 1;
        fetchLogs();
    };

    const toggleSort = (field) => {
        if (state.sortBy === field) {
            state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            state.sortBy = field;
            state.sortDirection = 'desc';
        }
        state.currentPage = 1;
        fetchLogs();
    };

    const selectLog = (log) => {
        state.selectedLog = log;
        state.parsedContent = parseLogMessage(log.message);
        fetchLogDetail(log.id);
    };

    const closeDetail = () => {
        state.selectedLog = null;
        state.logDetail = null;
    };

    function openAuthModal() {
        state.authModalOpen = true;
    }

    function closeAuthModal() {
        state.authModalOpen = false;
        checkForAuthAfterModalOpen();
    }

    onBeforeUnmount(() => {
        document.removeEventListener('click', handleClickOutside);
    });

    let toggleAuthModalFunction = null;

    function setToggleAuthModal(fn) {
        toggleAuthModalFunction = fn;
    }

    function toggleAuthModal(callback) {
        if (toggleAuthModalFunction) {
            toggleAuthModalFunction(() => {
                if (typeof callback === 'function') {
                    console.log('Authentication callback will be executed after login');
                    setTimeout(() => {
                        if (checkIfRootUser()) {
                            console.log('User is now admin, executing callback');
                            callback();
                        }
                    }, 1000);
                }
            });

            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList' && document.body.classList.contains('modal-closed')) {
                        const isAdmin = checkIfRootUser();
                        if (isAdmin && typeof callback === 'function') {
                            console.log('User authenticated via modal, executing callback');
                            callback();
                        }
                        observer.disconnect();
                    }
                });
            });

            observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        }
    }

    function setupAuthListener() {
        const initialAuthState = checkIfRootUser();

        const authCheckInterval = setInterval(() => {
            const currentAuthState = checkIfRootUser();

            if (!initialAuthState && currentAuthState) {
                console.log('User authenticated as admin, refreshing logs...');
                fetchLogs();
                clearInterval(authCheckInterval);
            }
        }, 1000);

        onBeforeUnmount(() => {
            clearInterval(authCheckInterval);
        });
    }

    function handleSuccessfulAuth() {
        getAuthToken();

        if (state.isRootUser) {
            setTimeout(() => {
                fetchLogs();
            }, 500);
        }
    }

    function listenForAuthChanges() {
        window.removeEventListener('storage', handleStorageChange);

        window.addEventListener('storage', handleStorageChange);

        window.addEventListener('authSuccess', () => {
            console.log('Auth success event detected, refreshing logs...');
            getAuthToken();
            fetchLogs();
        });

        const storageCheckInterval = setInterval(() => {
            const wasAdmin = state.isRootUser;
            const isNowAdmin = checkIfRootUser();

            if (!wasAdmin && isNowAdmin) {
                console.log('User gained admin privileges, refreshing logs...');
                getAuthToken();
                fetchLogs();
            }

            state.isRootUser = isNowAdmin;
        }, 1500);

        onBeforeUnmount(() => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('authSuccess', fetchLogs);
            clearInterval(storageCheckInterval);
        });
    }

    function handleStorageChange(event) {
        if (event.key === 'apiExplorerAuth') {
            console.log('Auth storage changed, checking permissions...');
            const wasAdmin = state.isRootUser;
            getAuthToken();

            if (!wasAdmin && state.isRootUser) {
                console.log('User authenticated as admin via storage event, refreshing logs...');
                fetchLogs();
            }
        }
    }

    function checkForAuthAfterModalOpen() {
        const wasAdmin = state.isRootUser;
        let checkCount = 0;

        const authCheckTimer = setInterval(() => {
            checkCount++;
            getAuthToken();

            if (!wasAdmin && state.isRootUser) {
                console.log('User authenticated successfully, refreshing logs...');
                fetchLogs();
                clearInterval(authCheckTimer);
            }

            if (checkCount >= 10) {
                clearInterval(authCheckTimer);
            }
        }, 1000);

        onBeforeUnmount(() => {
            clearInterval(authCheckTimer);
        });
    }

    return {
        logs: computed(() => state.logs),
        loading: computed(() => state.loading),
        error: computed(() => state.error),
        selectedLog: computed(() => state.selectedLog),
        logDetail: computed(() => state.logDetail),
        detailLoading: computed(() => state.detailLoading),
        currentPage: computed(() => state.currentPage),
        pageSize: computed(() => state.pageSize),
        totalLogs: computed(() => state.totalLogs),
        totalPages: computed(() => state.totalPages),
        sortBy: computed(() => state.sortBy),
        sortDirection: computed(() => state.sortDirection),
        filters: computed(() => state.filters),
        availableLevels: computed(() => state.availableLevels),
        parsedContent: computed(() => state.parsedContent),
        showStartCalendar: computed(() => state.showStartCalendar),
        showEndCalendar: computed(() => state.showEndCalendar),
        startCalendarMonth: computed({
            get: () => state.startCalendarMonth,
            set: (value) => { state.startCalendarMonth = value }
        }),
        startCalendarYear: computed({
            get: () => state.startCalendarYear,
            set: (value) => { state.startCalendarYear = value }
        }),
        endCalendarMonth: computed({
            get: () => state.endCalendarMonth,
            set: (value) => { state.endCalendarMonth = value }
        }),
        endCalendarYear: computed({
            get: () => state.endCalendarYear,
            set: (value) => { state.endCalendarYear = value }
        }),
        startHours: computed({
            get: () => state.startHours,
            set: (value) => { state.startHours = value }
        }),
        startMinutes: computed({
            get: () => state.startMinutes,
            set: (value) => { state.startMinutes = value }
        }),
        endHours: computed({
            get: () => state.endHours,
            set: (value) => { state.endHours = value }
        }),
        endMinutes: computed({
            get: () => state.endMinutes,
            set: (value) => { state.endMinutes = value }
        }),
        weekDays: computed(() => state.weekDays),
        monthNames: computed(() => state.monthNames),
        yearRange,
        startCalendarDays: computed(() => state.startCalendarDays),
        endCalendarDays: computed(() => state.endCalendarDays),
        refreshData,
        selectLog,
        closeDetail,
        applyFilters,
        clearFilters,
        handleSearchInput,
        goToFirstPage,
        goToLastPage,
        goToNextPage,
        goToPreviousPage,
        handlePageInputChange,
        handlePageSizeChange,
        toggleSort,
        formatTimestamp,
        getLevelClass,
        toggleCalendar: (type) => {
            if (type === 'start') {
                state.showStartCalendar = !state.showStartCalendar;
                state.showEndCalendar = false;

                if (state.showStartCalendar) {
                    if (state.filters.startDate) {
                        const date = new Date(state.filters.startDate);
                        state.startCalendarMonth = date.getMonth();
                        state.startCalendarYear = date.getFullYear();
                        state.startHours = date.getHours();
                        state.startMinutes = date.getMinutes();
                    } else {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        state.startCalendarMonth = today.getMonth();
                        state.startCalendarYear = today.getFullYear();
                        state.startHours = 0;
                        state.startMinutes = 0;
                    }

                    generateStartCalendarDays();

                    setTimeout(() => {
                        document.addEventListener('click', handleClickOutside);
                    }, 100);
                }
            } else if (type === 'end') {
                state.showEndCalendar = !state.showEndCalendar;
                state.showStartCalendar = false;

                if (state.showEndCalendar) {
                    if (state.filters.endDate) {
                        const date = new Date(state.filters.endDate);
                        state.endCalendarMonth = date.getMonth();
                        state.endCalendarYear = date.getFullYear();
                        state.endHours = date.getHours();
                        state.endMinutes = date.getMinutes();
                    } else {
                        const today = new Date();
                        today.setHours(23, 59, 59, 999);
                        state.endCalendarMonth = today.getMonth();
                        state.endCalendarYear = today.getFullYear();
                        state.endHours = 23;
                        state.endMinutes = 59;
                    }

                    generateEndCalendarDays();

                    setTimeout(() => {
                        document.addEventListener('click', handleClickOutside);
                    }, 100);
                }
            }
        },
        closeCalendar,
        prevMonth,
        nextMonth,
        updateCalendar,
        isToday,
        isSelectedStartDate,
        isSelectedEndDate,
        selectStartDate,
        selectEndDate,
        selectToday,
        updateStartTime,
        updateEndTime,
        formatCalendarDate,
        requiresAuthentication: computed(() => state.requiresAuthentication),
        isRootUser: computed(() => state.isRootUser),
        authModalOpen: computed(() => state.authModalOpen),
        openAuthModal,
        closeAuthModal,
        setToggleAuthModal,
        toggleAuthModal,
        setupAuthListener,
        listenForAuthChanges,
        fetchLogs
    };
};
