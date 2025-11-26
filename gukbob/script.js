// 압축된 데이터 해제 함수
function decompressReportData() {
    const urlParams = new URLSearchParams(window.location.search);
    const compressedData = urlParams.get('data');
    
    if (!compressedData) {
        return null;
    }
    
    try {
        // Base64 디코딩 후 JSON 파싱
        const decodedData = decodeURIComponent(escape(atob(decodeURIComponent(compressedData))));
        return JSON.parse(decodedData);
    } catch (error) {
        console.error('데이터 압축 해제 실패:', error);
        return null;
    }
}

// URL 파라미터 파싱
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        TOT_DC_AMT: params.get('TOT_DC_AMT'),        
        TOTAL_SALE_AMT: parseInt(params.DCM_SALE_AMT) + parseInt(params.CASH_AMT),
        POS_CSH_OUT_AMT: params.get('POS_CSH_OUT_AMT'),
        TOT_REM_AMT: params.get('TOT_REM_AMT'),
        LOSS_CASH_AMT: params.get('LOSS_CASH_AMT'),
        DCM_SALE_AMT: params.get('DCM_SALE_AMT'),
        CASH_AMT: params.get('CASH_AMT'),
        monthly_data: params.get('monthly_data'),
        review_count: params.get('review_count')
    };
}

// TOT_DC_AMT를 체험단과 서비스로 분리하는 함수
function separateExperienceAndService(totDcAmt) {
    const amount = parseInt(totDcAmt) || 0;
    
    if (amount === 0) {
        return {
            experienceAmount: 0,
            experienceCount: 0,
            serviceAmount: 0,
            serviceCount: 0
        };
    }
    
    // 25000으로 나누어떨어지면 체험단으로 분류
    if (amount % 25000 === 0) {
        return {
            experienceAmount: amount,
            experienceCount: amount / 25000,
            serviceAmount: 0,
            serviceCount: 0
        };
    } else {
        // 나누어떨어지지 않으면 서비스로 분류
        return {
            experienceAmount: 0,
            experienceCount: 0,
            serviceAmount: amount,
            serviceCount: 1
        };
    }
}

// 숫자 포맷팅 (천단위 콤마)
function formatNumber(num) {
    if (!num) return '0';
    return parseInt(num).toLocaleString('ko-KR');
}

// 현금 계수 계산
function calculateTotal() {
    const denominations = [
        { id: 'bill100000', value: 100000 },
        { id: 'bill50000', value: 50000 },
        { id: 'bill10000', value: 10000 },
        { id: 'bill5000', value: 5000 },
        { id: 'bill1000', value: 1000 },
        { id: 'coin500', value: 500 },
        { id: 'coin100', value: 100 },
        { id: 'coin50', value: 50 },
        { id: 'coin10', value: 10 }
    ];

    let total = 0;

    denominations.forEach(denom => {
        const count = parseInt(document.getElementById(denom.id).value) || 0;
        const amount = count * denom.value;
        total += amount;
        
        // 각 금종별 금액 표시
        document.getElementById(`amount${denom.value}`).textContent = formatNumber(amount) + '원';
    });

    // 총 금액 표시
    document.getElementById('totalAmount').textContent = formatNumber(total) + '원';
    
}

// 데이터 표시
function displayData() {
    const params = getUrlParams();
    const container = document.getElementById('dataContainer');
    
    // 파라미터가 있는지 확인
    const hasData = Object.values(params).some(value => value !== null);
    
    if (!hasData) {
        container.innerHTML = '<div class="no-data">URL 파라미터가 없습니다.</div>';
        return;
    }

    // TOT_DC_AMT를 체험단과 서비스로 분리
    const separated = separateExperienceAndService(params.TOT_DC_AMT);

    const dataLabels = {
        TOT_DC_AMT: '서비스 금액',
        TOT_REM_AMT: '현재 시재',
        LOSS_CASH_AMT: '과부족',
        DCM_SALE_AMT: '카드 매출',
        CASH_AMT: '현금 매출',
        TOTAL_SALE_AMT: '금일 총 매출',
        monthly_data: '월 매출총액',
        POS_CSH_OUT_AMT: '지출',
        review_count: '리뷰 수'
    };

    let html = '';

    
    // 분리된 체험단/서비스 정보 표시
    if (separated.experienceAmount > 0) {
        document.getElementById('experienceAmount').value = separated.experienceAmount;
        document.getElementById('experienceCount').value = separated.experienceCount;
    }
    
    if (separated.serviceAmount > 0) {
        document.getElementById('serviceAmount').value = separated.serviceAmount;
        document.getElementById('serviceCount').value = separated.serviceCount;
    }
    
    // 나머지 파라미터들 표시
    for (const [key, value] of Object.entries(params)) {
        if (value === null) { continue; }
        let typeStr = "원";
        if (key === 'review_count') { typeStr = "팀"; }
        const isNegative = parseInt(value) < 0;
        html += `
        <div class="data-item">
        <span class="label">${dataLabels[key]}:</span>
        <span class="value ${isNegative ? 'negative' : ''}">${formatNumber(value)}${typeStr}</span>
        </div>
        `;
        
    }
    
    document.getElementById('monthlyTotal').value = parseInt(params.monthly_data) || -1;;
    document.getElementById('reviewCount').value = parseInt(params.review_count) || -1;
    container.innerHTML = html;
}

function generateQRCode() {
    const url = generateReportUrl();
    var svgNode = QRCode({
     msg :  `${url}`
    ,dim :   500
    ,pad :   6
    ,pal : ["#000000", "#f2f4f8"]
    });
    svgNode = QRCode(url);

    document.getElementById("qrcode-svg").appendChild(svgNode);
    svgNode.onclick = () => {
        window.open(url, '_blank');
    };
}

function generateReportUrl() {
    // 현재 URL을 참고하여 기본 URL 생성
    const currentUrl = new URL(window.location.href);
    const baseUrl = `${currentUrl.protocol}//${currentUrl.host}${currentUrl.pathname.replace(/[^/]*$/, '')}report.html`;
    
    const params = getUrlParams();
    const now = new Date();
    const dateStr = now.getFullYear() + '년 ' + 
                   String(now.getMonth() + 1).padStart(2, '0') + '월 ' + 
                   String(now.getDate()).padStart(2, '0') + '일';
    
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const dayStr = '(' + weekdays[now.getDay()] + ')';
    
    const cashSales = parseInt(params.CASH_AMT) || 0;
    const cardSales = parseInt(params.DCM_SALE_AMT) || 0;
    const totalSales = cashSales + cardSales;
    const lossAmount = parseInt(params.LOSS_CASH_AMT) || 0;
    const currentCash = parseInt(params.TOT_REM_AMT) || 0;
    const monthlyDataAmount = parseInt(params.monthly_data) || 0;
    
    // TOT_DC_AMT를 체험단과 서비스로 분리
    const separated = separateExperienceAndService(params.TOT_DC_AMT);
    
    // 입력된 값들 가져오기
    const lossCount = parseInt(document.getElementById('lossCount').value) || 0;
    const serviceCountInput = parseInt(document.getElementById('serviceCount').value) || 0;
    const experienceCountInput = parseInt(document.getElementById('experienceCount').value) || 0;
    const experienceAmountInput = parseInt(document.getElementById('experienceAmount').value) || 0;
    const serviceAmountInput = parseInt(document.getElementById('serviceAmount').value) || 0;
    const monthlyTotal = parseInt(document.getElementById('monthlyTotal').value) || 0;
    const returnAmount = parseInt(document.getElementById('returnAmount').value) || 0;
    const returnDetails = document.getElementById('returnDetails').value || '';
    const todayCash = parseInt(document.getElementById('todayCash').value) || 0;
    const nextDayCash = parseInt(document.getElementById('nextDayCash').value) || 0;
    const cardExpense = parseInt(document.getElementById('cardExpense').value) || 0;
    const cashExpense = parseInt(document.getElementById('cashExpense').value) || 0;
    const revisitCount = parseInt(document.getElementById('revisitCount').value) || 0;
    const deliveryCount = parseInt(document.getElementById('deliveryCount').value) || 0;
    const deliveryAmount = parseInt(document.getElementById('deliveryAmount').value) || 0;
    const bankBalance = parseInt(document.getElementById('bankBalance').value) || 0;
    const reviewCount = parseInt(document.getElementById('reviewCount').value) || 0;
    
    // 현금 계수 총액 계산 (돈봉투)
    const denominations = [
        { id: 'bill100000', value: 100000 },
        { id: 'bill50000', value: 50000 },
        { id: 'bill10000', value: 10000 },
        { id: 'bill5000', value: 5000 },
        { id: 'bill1000', value: 1000 },
        { id: 'coin500', value: 500 },
        { id: 'coin100', value: 100 },
        { id: 'coin50', value: 50 },
        { id: 'coin10', value: 10 }
    ];
    
    let cashTotal = 0;
    denominations.forEach(denom => {
        const count = parseInt(document.getElementById(denom.id).value) || 0;
        cashTotal += count * denom.value;
    });
    
    const totalExpense = cardExpense + cashExpense;
    const adjustedTotalSales = totalSales - returnAmount;
    
    // 모든 데이터를 하나의 객체로 압축 (0 값과 빈 문자열 제외)
    const rawData = {
        date: dateStr,
        day: dayStr,
        totalSales: totalSales,
        cashSales: cashSales,
        cardSales: cardSales,
        serviceAmount: serviceAmountInput || separated.serviceAmount,
        serviceCount: serviceCountInput || separated.serviceCount,
        experienceAmount: experienceAmountInput || separated.experienceAmount,
        experienceCount: experienceCountInput || separated.experienceCount,
        returnAmount: returnAmount,
        returnDetails: returnDetails || formatNumber(returnAmount) + '원',
        adjustedTotalSales: adjustedTotalSales,
        monthlyTotal: monthlyTotal,
        monthlyDataAmount: monthlyDataAmount,
        todayCash: todayCash || currentCash,
        nextDayCash: nextDayCash || currentCash,
        cardExpense: cardExpense,
        cashExpense: cashExpense,
        totalExpense: totalExpense,
        lossAmount: lossAmount,
        lossCount: lossCount,
        reviewCount: reviewCount,
        revisitCount: revisitCount,
        deliveryCount: deliveryCount,
        deliveryAmount: deliveryAmount,
        cashTotal: cashTotal,
        currentCash: currentCash,
        bankBalance: bankBalance
    };
    
    // 0 값과 빈 문자열을 제외한 데이터만 포함
    const reportData = {};
    Object.keys(rawData).forEach(key => {
        const value = rawData[key];
        // 문자열인 경우 빈 문자열이 아닌 경우만, 숫자인 경우 0이 아닌 경우만 포함
        if ((typeof value === 'string' && value !== '' && value !== '0원') || 
            (typeof value === 'number' && value !== 0) ||
            key === 'date' || key === 'day') { // 날짜와 요일은 항상 포함
            reportData[key] = value;
        }
    });
    
    // JSON을 Base64로 인코딩하여 압축
    const compressedData = btoa(unescape(encodeURIComponent(JSON.stringify(reportData))));
    
    return `${baseUrl}?data=${encodeURIComponent(compressedData)}`;
}

// 통장잔액 localStorage 관리 함수들
function saveBankBalance() {
    const bankBalance = document.getElementById('bankBalance').value;
    localStorage.setItem('gukbob_bankBalance', bankBalance);
    console.log('통장잔액 저장됨:', bankBalance);
}

function loadBankBalance() {
    const savedBalance = localStorage.getItem('gukbob_bankBalance');
    if (savedBalance !== null) {
        document.getElementById('bankBalance').value = savedBalance;
        console.log('통장잔액 불러옴:', savedBalance);
    }
}

// 통장잔액 입력 이벤트 리스너 설정
function setupBankBalanceAutoSave() {
    const bankBalanceInput = document.getElementById('bankBalance');
    if (bankBalanceInput) {
        // 값이 변경될 때마다 자동 저장
        bankBalanceInput.addEventListener('input', saveBankBalance);
        bankBalanceInput.addEventListener('change', saveBankBalance);
    }
}

// 페이지 로드 시 데이터 표시
window.onload = function() {
    displayData();
    calculateTotal();
    loadReviewCount();
    loadBankBalance(); // 통장잔액 불러오기
    setupBankBalanceAutoSave(); // 자동 저장 설정
};
