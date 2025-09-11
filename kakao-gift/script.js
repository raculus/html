// 유틸: 숫자 그룹화(4자리 공백)
const group4 = v => v.replace(/\s+/g,'').replace(/(.{4})/g,'$1 ').trim();

const els = {
  imgIn: document.getElementById('productImageInput'),
  imgUrlIn: document.getElementById('productImageUrl'),
  img: document.getElementById('productImage'),
  drop: document.getElementById('productDrop'),

  brand: document.getElementById('brandText'),
  title: document.getElementById('titleText'),
  barcodeSvg: document.getElementById('barcodeSvg'),
  barcodeText: document.getElementById('barcodeText'),
  merchant: document.getElementById('merchantText'),
  expire: document.getElementById('expireText'),
  order: document.getElementById('orderText'),

  stage: document.getElementById('stage'),
  saveBtn: document.getElementById('saveBtn'),
};

let prevObjectUrl = null;
function setImageSrc(url, isObjectUrl=false){
  if (!url) return;
  if (prevObjectUrl) {
    URL.revokeObjectURL(prevObjectUrl);
    prevObjectUrl = null;
  }
  if (isObjectUrl) prevObjectUrl = url;
  els.img.crossOrigin = 'anonymous';
  els.img.src = url;
}

function renderBarcode(value){
  const code = (value || '').trim();
  if(!code){
    els.barcodeSvg.innerHTML = '';
    els.barcodeText.textContent = '';
    return;
  }
  JsBarcode(els.barcodeSvg, code, {
    format: 'CODE128',
    lineColor: '#000',
    width: 2,          // 막대 두께
    height: 100,
    displayValue: false,
    margin: 0,
  });
  els.barcodeText.textContent = group4(code);
}

function bind(){
  // 파일 업로드
  els.imgIn.addEventListener('change', (e)=>{
    const file = e.target.files?.[0];
    if(!file) return;
    const url = URL.createObjectURL(file);
    setImageSrc(url, true);
  });

  // 이미지 영역 클릭으로 파일 선택 열기
  els.drop.addEventListener('click', ()=> els.imgIn.click());

  // 드래그 앤 드롭
  ['dragenter','dragover'].forEach(ev=>{
    els.drop.addEventListener(ev, e=>{ e.preventDefault(); e.dataTransfer.dropEffect='copy'; });
  });
  ['dragleave','drop'].forEach(ev=>{
    els.drop.addEventListener(ev, e=>{ e.preventDefault(); });
  });
  els.drop.addEventListener('drop', e=>{
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setImageSrc(url, true);
    }
  });

  // 붙여넣기(이미지 파일 또는 이미지 URL)
  window.addEventListener('paste', async (e)=>{
    if (e.clipboardData) {
      // 파일
      const item = [...e.clipboardData.items].find(it=> it.type.startsWith('image/'));
      if (item) {
        const file = item.getAsFile();
        if (file) {
          const url = URL.createObjectURL(file);
          setImageSrc(url, true);
          return;
        }
      }
      // 텍스트 URL
      const text = e.clipboardData.getData('text');
      if (text && /^https?:\/\//i.test(text)) {
        setImageSrc(text, false);
      }
    }
  });

  // 이미지 URL 입력
  const applyUrl = () => {
    const url = (els.imgUrlIn.value || '').trim();
    if (url) setImageSrc(url, false);
  };
  els.imgUrlIn.addEventListener('change', applyUrl);
  els.imgUrlIn.addEventListener('blur', applyUrl);

  // 인라인 편집 반영
  const textSync = (el, cb)=>{
    const handler = ()=> cb(el.textContent || '');
    ['input','blur','keyup','paste'].forEach(evt=> el.addEventListener(evt, handler));
  };
  textSync(els.brand, v=> els.brand.textContent = v);
  textSync(els.title, v=> els.title.textContent = v);
  // 바코드: 4자리 공백 그룹화 + 커서 유지
  els.barcodeText.addEventListener('beforeinput', (e)=>{
    // allow default; we handle formatting post-input
  });
  els.barcodeText.addEventListener('input', (e)=>{
    const el = els.barcodeText;
    const sel = window.getSelection();
    const anchorOffset = sel && sel.anchorNode === el.firstChild ? sel.anchorOffset : (el.textContent ? el.textContent.length : 0);
    const raw = (el.textContent || '').replace(/\D+/g,'');

    // compute position mapping: from raw index to grouped index
    const re = /(.{1,4})/g;
    const chunks = raw.match(re) || [];
    const grouped = chunks.join(' ');

    // derive caret index in raw based on anchorOffset before formatting
    const before = (el.textContent || '');
    const rawBefore = before.slice(0, anchorOffset).replace(/\D+/g,'');
    const rawCaret = rawBefore.length;

    // set formatted text
    el.textContent = grouped;
    renderBarcode(raw);

    // place caret after corresponding grouped position
    const groupedCaret = (()=>{
      // number of spaces inserted before rawCaret = Math.floor((rawCaret-1)/4)
      if (rawCaret <= 0) return 0;
      const spaces = Math.floor((rawCaret-1)/4);
      return rawCaret + spaces;
    })();
    const range = document.createRange();
    const node = el.firstChild || el;
    const len = (el.textContent || '').length;
    range.setStart(node, Math.min(groupedCaret, len));
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  });
  // other inline texts
  textSync(els.brand, v=> els.brand.textContent = v);
  textSync(els.title, v=> els.title.textContent = v);
  textSync(els.merchant, v=> els.merchant.textContent = v);
  textSync(els.expire, v=> els.expire.textContent = v);
  textSync(els.order, v=> els.order.textContent = v);
  textSync(els.merchant, v=> els.merchant.textContent = v);
  textSync(els.expire, v=> els.expire.textContent = v);
  textSync(els.order, v=> els.order.textContent = v);

  // 저장 버튼
  els.saveBtn.addEventListener('click', async ()=>{
    // 저장 중 상태 클래스 추가(힌트 숨김 등)
    els.stage.classList.add('saving');
    const canvas = await html2canvas(els.stage, {
      backgroundColor: getComputedStyle(els.stage).backgroundColor || '#ffd400',
      scale: 2,
      useCORS: true,   // 외부 이미지 저장 가능(서버가 CORS 허용 시)
    });
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `voucher_${Date.now()}.png`;
    a.click();
    els.stage.classList.remove('saving');
  });
}

// 초기값 반영
function init(){
  // 기본 값 세팅 (예시)
  els.brand.textContent = '교X치킨';
  els.title.textContent = '허니콤보웨지감자세트';
  renderBarcode('946974357144');
  els.merchant.textContent = '교X치킨';
  els.expire.textContent = '2025년 12월 31일';
  els.order.textContent = '1568666940';
}
bind();
init();