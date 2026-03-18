// ============================================================
// DX診断結果 PDFダウンロード機能
// ============================================================
// 【使い方】
// 1. diagnosis.html の <head> に以下の2行を追加:
//    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
//    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js"></script>
//
// 2. diagnosis.html の既存 <script> タグの後に以下を追加:
//    <script src="pdf-download-patch.js"></script>
//
// ※ または、このファイルの内容を既存の <script> タグ内の末尾にコピペしてもOK
// ============================================================

(function() {
  'use strict';

  // --- 既存の showResults をラップして、PDF ボタンを挿入 ---
  const _origShowResults = window.showResults;

  if (typeof _origShowResults === 'function') {
    window.showResults = function() {
      // 元の showResults を実行
      _origShowResults.apply(this, arguments);
      // PDF ボタンを追加
      injectPdfButton();
    };
  } else {
    // showResults が見つからない場合、MutationObserver で結果表示を監視
    const observer = new MutationObserver(function(mutations) {
      const resultsSection = document.getElementById('resultsSection');
      if (resultsSection && resultsSection.children.length > 0) {
        // 既にボタンが追加されていなければ追加
        if (!document.getElementById('pdfDownloadBtn')) {
          injectPdfButton();
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function injectPdfButton() {
    const resultsSection = document.getElementById('resultsSection');
    if (!resultsSection) return;
    if (document.getElementById('pdfDownloadBtn')) return; // 重複防止

    // CTA セクション（「無料相談を予約する」ボタン）の前にPDFボタンを挿入
    const ctaBanner = resultsSection.querySelector('.cta-banner, .results-cta');
    
    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'text-align:center; margin: 32px 0;';
    btnContainer.innerHTML = `
      <button id="pdfDownloadBtn" onclick="window.__downloadDxPdf()" style="
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 14px 32px;
        background: linear-gradient(135deg, #1a5276 0%, #2980b9 100%);
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(26,82,118,0.3);
        transition: all 0.3s ease;
      " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(26,82,118,0.4)'"
         onmouseout="this.style.transform=''; this.style.boxShadow='0 4px 14px rgba(26,82,118,0.3)'">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        診断結果をPDFでダウンロード
      </button>
      <p style="margin-top: 8px; font-size: 13px; color: #888;">
        保存して後から見返すことができます
      </p>
    `;

    if (ctaBanner) {
      ctaBanner.parentNode.insertBefore(btnContainer, ctaBanner);
    } else {
      resultsSection.appendChild(btnContainer);
    }
  }

  // --- PDF 生成処理 ---
  window.__downloadDxPdf = async function() {
    const btn = document.getElementById('pdfDownloadBtn');
    const originalHTML = btn.innerHTML;
    
    // ローディング表示
    btn.disabled = true;
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.3"/>
        <path d="M21 12a9 9 0 01-9 9"/>
      </svg>
      PDF生成中...
    `;
    // スピンアニメーション用のスタイルを追加
    if (!document.getElementById('pdfSpinStyle')) {
      const style = document.createElement('style');
      style.id = 'pdfSpinStyle';
      style.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
      document.head.appendChild(style);
    }

    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      // --- ヘッダー ---
      pdf.setFillColor(26, 82, 118);
      pdf.rect(0, 0, pageWidth, 45, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.text('StarEight DX Consulting', margin, 15);
      
      pdf.setFontSize(20);
      pdf.text('DX', margin, 30, { charSpace: 2 });
      // 日本語フォントがないため英語で表記
      pdf.setFontSize(14);
      pdf.text('DX Diagnosis Report', margin + 15, 30);
      
      pdf.setFontSize(9);
      const today = new Date();
      const dateStr = today.getFullYear() + '/' + 
                      String(today.getMonth() + 1).padStart(2, '0') + '/' +
                      String(today.getDate()).padStart(2, '0');
      pdf.text(dateStr, pageWidth - margin, 38, { align: 'right' });
      
      y = 55;

      // --- 結果セクションをキャプチャ ---
      const resultsSection = document.getElementById('resultsSection');
      if (resultsSection) {
        // PDFボタン自体を一時的に非表示に
        const pdfBtnContainer = btn.parentNode;
        pdfBtnContainer.style.display = 'none';

        const canvas = await html2canvas(resultsSection, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: 800, // 固定幅でレンダリング
        });

        pdfBtnContainer.style.display = '';

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // 画像が1ページに収まらない場合、複数ページに分割
        let imgY = y;
        const availableHeight = pageHeight - margin - y;
        
        if (imgHeight <= availableHeight) {
          pdf.addImage(imgData, 'PNG', margin, imgY, imgWidth, imgHeight);
        } else {
          // 複数ページに分割
          let remainingHeight = imgHeight;
          let sourceY = 0;
          let isFirstPage = true;

          while (remainingHeight > 0) {
            if (!isFirstPage) {
              pdf.addPage();
              imgY = margin;
            }
            
            const sliceHeight = isFirstPage ? availableHeight : (pageHeight - margin * 2);
            const sourceHeight = (sliceHeight / imgHeight) * canvas.height;

            // 部分キャンバスを作成
            const sliceCanvas = document.createElement('canvas');
            sliceCanvas.width = canvas.width;
            sliceCanvas.height = Math.min(sourceHeight, canvas.height - sourceY);
            const ctx = sliceCanvas.getContext('2d');
            ctx.drawImage(canvas, 
              0, sourceY, canvas.width, sliceCanvas.height,
              0, 0, sliceCanvas.width, sliceCanvas.height
            );

            const sliceImgData = sliceCanvas.toDataURL('image/png');
            const sliceImgHeight = (sliceCanvas.height * imgWidth) / sliceCanvas.width;
            
            pdf.addImage(sliceImgData, 'PNG', margin, imgY, imgWidth, sliceImgHeight);

            sourceY += sliceCanvas.height;
            remainingHeight -= sliceHeight;
            isFirstPage = false;
          }
        }
      }

      // --- フッター（各ページ） ---
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          'StarEight LLC - https://stareight-dx-site.pages.dev',
          pageWidth / 2, pageHeight - 8,
          { align: 'center' }
        );
        pdf.text(
          i + ' / ' + totalPages,
          pageWidth - margin, pageHeight - 8,
          { align: 'right' }
        );
      }

      // --- ダウンロード ---
      pdf.save('DX_Diagnosis_' + dateStr.replace(/\//g, '') + '.pdf');

      // 成功表示
      btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        ダウンロード完了！
      `;
      btn.style.background = 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)';
      
      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.style.background = 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)';
        btn.disabled = false;
      }, 2500);

    } catch (err) {
      console.error('PDF generation error:', err);
      btn.innerHTML = 'エラーが発生しました。再試行してください。';
      btn.style.background = '#e74c3c';
      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.style.background = 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)';
        btn.disabled = false;
      }, 3000);
    }
  };

})();
