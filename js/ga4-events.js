// ============================================================
// StarEight DX Site — GA4 計測コード
// 測定ID: G-70X6QJZSQX
// ============================================================
//
// 【設置方法】
//
// ■ 全HTMLファイル（6ページ）の <head> 内、</head> の直前に以下を追加：
//
//   <!-- Google Analytics 4 -->
//   <script async src="https://www.googletagmanager.com/gtag/js?id=G-70X6QJZSQX"></script>
//   <script src="js/ga4-events.js"></script>
//
// ■ このファイル (ga4-events.js) を js/ フォルダに配置
//
// ============================================================

// ====== GA4 基本設定 ======
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-70X6QJZSQX');

// ====== カスタムイベント関数 ======

// 診断開始
function ga4DiagStart() {
  gtag('event', 'dx_diag_start', {
    event_category: 'diagnosis',
    event_label: 'start_button_click'
  });
}

// 診断完了
function ga4DiagComplete(score, level, diagId) {
  gtag('event', 'dx_diag_complete', {
    event_category: 'diagnosis',
    event_label: level,
    value: score,
    dx_score: score,
    dx_level: level,
    dx_diag_id: diagId || ''
  });
}

// PDFダウンロード
function ga4PdfDownload(score, level) {
  gtag('event', 'dx_pdf_download', {
    event_category: 'diagnosis',
    event_label: 'pdf_download',
    dx_score: score,
    dx_level: level
  });
}

// 無料相談CTAクリック
function ga4ContactClick(source, score) {
  gtag('event', 'dx_contact_click', {
    event_category: 'conversion',
    event_label: source || 'cta_button',
    dx_score: score || ''
  });
}

// フォーム送信完了
function ga4FormSubmit(formType) {
  gtag('event', 'dx_form_submit', {
    event_category: 'conversion',
    event_label: formType || 'contact_form'
  });
}
