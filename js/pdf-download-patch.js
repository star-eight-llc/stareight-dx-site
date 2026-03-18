// ============================================================
// DX診断結果 PDFダウンロード機能 v2
// diagnosis.html の </body> 直前で読み込む
// ============================================================
(function() {
  'use strict';

  // --- showResults のラップ ---
  var _orig = window.showResults;

  window.showResults = function() {
    _orig.apply(this, arguments);
    injectPdfButton();
  };

  function injectPdfButton() {
    var results = document.getElementById('diag-results');
    if (!results) return;
    if (document.getElementById('pdfDownloadBtn')) return;

    // CTA banner の直前に挿入
    var ctaBanner = results.querySelector('.cta-banner');

    var container = document.createElement('div');
    container.style.cssText = 'text-align:center; margin: 32px 0;';
    container.innerHTML =
      '<button id="pdfDownloadBtn" style="' +
        'display:inline-flex;align-items:center;gap:8px;' +
        'padding:14px 32px;' +
        'background:linear-gradient(135deg,#1a5276 0%,#2980b9 100%);' +
        'color:#fff;border:none;border-radius:8px;' +
        'font-size:16px;font-weight:600;cursor:pointer;' +
        'box-shadow:0 4px 14px rgba(26,82,118,0.3);' +
        'transition:all 0.3s ease;">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>' +
          '<polyline points="7 10 12 15 17 10"/>' +
          '<line x1="12" y1="15" x2="12" y2="3"/>' +
        '</svg>' +
        '診断結果をPDFでダウンロード' +
      '</button>' +
      '<p style="margin-top:8px;font-size:13px;color:#888;">保存して後から見返すことができます</p>';

    var btn = container.querySelector('button');
    btn.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 6px 20px rgba(26,82,118,0.4)';
    });
    btn.addEventListener('mouseleave', function() {
      this.style.transform = '';
      this.style.boxShadow = '0 4px 14px rgba(26,82,118,0.3)';
    });
    btn.addEventListener('click', downloadPdf);

    if (ctaBanner) {
      ctaBanner.parentNode.insertBefore(container, ctaBanner);
    } else {
      results.appendChild(container);
    }
  }

  // --- PDF生成 ---
  function downloadPdf() {
    var btn = document.getElementById('pdfDownloadBtn');
    var originalHTML = btn.innerHTML;

    btn.disabled = true;
    btn.style.opacity = '0.7';
    btn.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
        '<circle cx="12" cy="12" r="10" opacity="0.3"/>' +
        '<path d="M12 2a10 10 0 0 1 10 10" style="animation:pdfspin 1s linear infinite;transform-origin:center;">' +
      '</svg> PDF生成中...';

    if (!document.getElementById('__pdfSpinCSS')) {
      var st = document.createElement('style');
      st.id = '__pdfSpinCSS';
      st.textContent = '@keyframes pdfspin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}';
      document.head.appendChild(st);
    }

    var results = document.getElementById('diag-results');
    var btnContainer = btn.parentNode;
    btnContainer.style.display = 'none';

    html2canvas(results, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 800
    }).then(function(canvas) {
      btnContainer.style.display = '';

      var jsPDF = window.jspdf.jsPDF;
      var pdf = new jsPDF('p', 'mm', 'a4');
      var pw = 210, ph = 297, m = 15;
      var cw = pw - m * 2;

      // ヘッダー
      pdf.setFillColor(26, 82, 118);
      pdf.rect(0, 0, pw, 40, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(11);
      pdf.text('StarEight DX Consulting', m, 14);
      pdf.setFontSize(16);
      pdf.text('DX Diagnosis Report', m, 28);
      pdf.setFontSize(9);
      var d = new Date();
      var ds = d.getFullYear() + '/' +
               String(d.getMonth()+1).padStart(2,'0') + '/' +
               String(d.getDate()).padStart(2,'0');
      pdf.text(ds, pw - m, 34, {align:'right'});

      // 結果画像を配置
      var imgData = canvas.toDataURL('image/png');
      var imgW = cw;
      var imgH = (canvas.height * imgW) / canvas.width;
      var startY = 48;
      var availH = ph - m - startY;

      if (imgH <= availH) {
        pdf.addImage(imgData, 'PNG', m, startY, imgW, imgH);
      } else {
        var srcY = 0;
        var first = true;
        while (srcY < canvas.height) {
          if (!first) { pdf.addPage(); startY = m; availH = ph - m * 2; }
          var sliceH = Math.min(
            (availH / imgH) * canvas.height,
            canvas.height - srcY
          );
          var sc = document.createElement('canvas');
          sc.width = canvas.width;
          sc.height = sliceH;
          sc.getContext('2d').drawImage(canvas, 0, srcY, canvas.width, sliceH, 0, 0, sc.width, sc.height);
          var sImgH = (sliceH * imgW) / canvas.width;
          pdf.addImage(sc.toDataURL('image/png'), 'PNG', m, startY, imgW, sImgH);
          srcY += sliceH;
          first = false;
        }
      }

      // フッター
      var pages = pdf.internal.getNumberOfPages();
      for (var i = 1; i <= pages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text('StarEight LLC - https://stareight-dx-site.pages.dev', pw/2, ph-8, {align:'center'});
        pdf.text(i + ' / ' + pages, pw - m, ph - 8, {align:'right'});
      }

      pdf.save('DX_Diagnosis_' + ds.replace(/\//g,'') + '.pdf');

      btn.innerHTML =
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
          '<polyline points="20 6 9 17 4 12"/>' +
        '</svg> ダウンロード完了！';
      btn.style.background = 'linear-gradient(135deg,#27ae60 0%,#2ecc71 100%)';
      btn.style.opacity = '1';
      setTimeout(function() {
        btn.innerHTML = originalHTML;
        btn.style.background = 'linear-gradient(135deg,#1a5276 0%,#2980b9 100%)';
        btn.disabled = false;
      }, 2500);

    }).catch(function(err) {
      btnContainer.style.display = '';
      console.error('PDF error:', err);
      btn.innerHTML = 'エラーが発生しました。再試行してください。';
      btn.style.background = '#e74c3c';
      btn.style.opacity = '1';
      setTimeout(function() {
        btn.innerHTML = originalHTML;
        btn.style.background = 'linear-gradient(135deg,#1a5276 0%,#2980b9 100%)';
        btn.disabled = false;
      }, 3000);
    });
  }
})();
