// ============================================================
// DX診断結果 PDFダウンロード機能 v3
// html2canvas不要 — jsPDFのみで直接描画
// diagnosis.html の </body> 直前で読み込む
// ============================================================
(function() {
  'use strict';

  var _resultData = null;
  var _orig = window.showResults;

  window.showResults = function() {
    // 結果データを計算して保存
    var catScores = categories.map(function(cat, ci) {
      var idxs = [];
      allQuestions.forEach(function(q, i) { if (q.category === ci) idxs.push(i); });
      var total = 0;
      idxs.forEach(function(i) { total += answers[i]; });
      var maxScore = cat.questions.length * 2;
      return { name: cat.name, icon: cat.icon, score: total, max: maxScore, pct: Math.round((total / maxScore) * 100) };
    });

    var totalScore = 0, totalMax = 0;
    catScores.forEach(function(c) { totalScore += c.score; totalMax += c.max; });
    var totalPct = Math.round((totalScore / totalMax) * 100);

    var level, levelMsg;
    if (totalPct >= 80) { level = 'A'; levelMsg = 'DX先進企業です。'; }
    else if (totalPct >= 60) { level = 'B'; levelMsg = '基礎は整っています。'; }
    else if (totalPct >= 40) { level = 'C'; levelMsg = 'DXの入り口に立っています。'; }
    else { level = 'D'; levelMsg = 'DXの第一歩を踏み出しましょう。'; }

    var sorted = catScores.slice().sort(function(a,b) { return a.pct - b.pct; });

    var actionTexts = {
      "業務プロセス": "業務手順書の作成と、紙業務のデジタル移行から着手。Googleフォーム等の無料ツールで始められます。",
      "データ管理": "まず顧客・売上データの一元管理を。Googleスプレッドシートでの管理テンプレートをご提供可能です。",
      "データ活用": "月次KPI（売上・客数・客単価・リピート率）の可視化から。スターエイトの経営スコアカードがお役に立てます。",
      "ITツール活用": "Google Workspace等のクラウドツール導入を推奨。初期設定・移行をサポートします。",
      "セキュリティ": "パスワードポリシーの策定と、個人情報取扱いルールの文書化を最優先で。",
      "AI活用": "まずはChatGPTで議事録作成やメール文面生成から試しましょう。業務別の活用ガイドを提供可能です。",
      "DX推進体制": "DX推進の担当者を決め、年間予算を設定することが第一歩。スターエイトのDX顧問がサポートします。"
    };

    _resultData = {
      totalPct: totalPct,
      level: level,
      levelMsg: levelMsg,
      catScores: catScores,
      sorted: sorted,
      actionTexts: actionTexts
    };

    _orig.apply(this, arguments);
    injectPdfButton();
  };

  function injectPdfButton() {
    var results = document.getElementById('diag-results');
    if (!results) return;
    if (document.getElementById('pdfDownloadBtn')) return;

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

  // --- PDF生成（jsPDFのみ） ---
  function downloadPdf() {
    if (!_resultData) { alert('診断データがありません'); return; }

    var btn = document.getElementById('pdfDownloadBtn');
    var originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.style.opacity = '0.7';
    btn.innerHTML = 'PDF生成中...';

    try {
      var jsPDF = window.jspdf.jsPDF;
      var pdf = new jsPDF('p', 'mm', 'a4');
      var pw = 210, ph = 297, m = 20;
      var cw = pw - m * 2;
      var y = 0;
      var data = _resultData;
      var d = new Date();
      var ds = d.getFullYear() + '/' +
               String(d.getMonth()+1).padStart(2,'0') + '/' +
               String(d.getDate()).padStart(2,'0');

      // ヘッダー帯
      pdf.setFillColor(26, 82, 118);
      pdf.rect(0, 0, pw, 44, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('StarEight DX Consulting', m, 16);
      pdf.setFontSize(18);
      pdf.text('DX Diagnosis Report', m, 30);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(ds, pw - m, 36, {align:'right'});

      y = 56;

      // 総合スコア円
      var cx = pw / 2;
      var lc = getLevelColor(data.level);

      pdf.setDrawColor(lc.r, lc.g, lc.b);
      pdf.setLineWidth(2.5);
      pdf.circle(cx, y + 18, 18);
      pdf.setTextColor(lc.r, lc.g, lc.b);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(32);
      pdf.text(String(data.totalPct), cx, y + 20, {align:'center'});
      pdf.setFontSize(10);
      pdf.setTextColor(120, 120, 120);
      pdf.setFont('helvetica', 'normal');
      pdf.text('/ 100', cx, y + 28, {align:'center'});

      y += 42;

      // DXレベル
      pdf.setTextColor(lc.r, lc.g, lc.b);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text('DX Level : ' + data.level, cx, y, {align:'center'});

      y += 14;

      // 区切り線
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      pdf.line(m, y, pw - m, y);
      y += 8;

      // カテゴリ別スコア見出し
      pdf.setTextColor(40, 40, 40);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.text('Category Scores', m, y);
      y += 10;

      data.catScores.forEach(function(c) {
        var bc = getBarColor(c.pct);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(60, 60, 60);
        pdf.text(c.name, m, y);

        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(bc.r, bc.g, bc.b);
        pdf.text(c.pct + '%', pw - m, y, {align:'right'});

        y += 3;

        // バー背景
        pdf.setFillColor(230, 230, 230);
        pdf.roundedRect(m, y, cw, 4, 2, 2, 'F');

        // バー実績
        if (c.pct > 0) {
          var barW = Math.max(4, (c.pct / 100) * cw);
          pdf.setFillColor(bc.r, bc.g, bc.b);
          pdf.roundedRect(m, y, barW, 4, 2, 2, 'F');
        }

        y += 10;
      });

      y += 4;

      // 区切り線
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      pdf.line(m, y, pw - m, y);
      y += 8;

      // TOP3アクション見出し
      pdf.setTextColor(40, 40, 40);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.text('Top 3 Priority Actions', m, y);
      y += 10;

      for (var i = 0; i < 3 && i < data.sorted.length; i++) {
        var cat = data.sorted[i];
        var actionText = data.actionTexts[cat.name] || '';

        if (y > ph - 50) { pdf.addPage(); y = m; }

        // 番号バッジ
        pdf.setFillColor(41, 128, 185);
        pdf.roundedRect(m, y - 4, 6, 6, 1, 1, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.text(String(i + 1), m + 3, y, {align:'center'});

        // カテゴリ名
        pdf.setTextColor(41, 128, 185);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text(cat.name + '  (' + cat.pct + '%)', m + 9, y);
        y += 6;

        // 説明テキスト（折り返し）
        pdf.setTextColor(80, 80, 80);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        var lines = pdf.splitTextToSize(actionText, cw - 10);
        pdf.text(lines, m + 9, y);
        y += lines.length * 4.5 + 8;
      }

      // CTA帯
      y += 8;
      if (y > ph - 40) { pdf.addPage(); y = m; }

      pdf.setFillColor(26, 82, 118);
      pdf.roundedRect(m, y, cw, 28, 3, 3, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('Free Consultation Available', pw / 2, y + 12, {align:'center'});
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text('https://stareight-dx-site.pages.dev/contact.html', pw / 2, y + 20, {align:'center'});

      // 全ページフッター
      var pages = pdf.internal.getNumberOfPages();
      for (var p = 1; p <= pages; p++) {
        pdf.setPage(p);
        pdf.setFontSize(7);
        pdf.setTextColor(160, 160, 160);
        pdf.setFont('helvetica', 'normal');
        pdf.text('StarEight LLC  |  https://stareight-dx-site.pages.dev', pw/2, ph-6, {align:'center'});
        pdf.text(p + ' / ' + pages, pw - m, ph - 6, {align:'right'});
      }

      pdf.save('DX_Diagnosis_' + ds.replace(/\//g,'') + '.pdf');

      // 成功
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

    } catch (err) {
      console.error('PDF error:', err);
      btn.innerHTML = 'エラーが発生しました。再試行してください。';
      btn.style.background = '#e74c3c';
      btn.style.opacity = '1';
      setTimeout(function() {
        btn.innerHTML = originalHTML;
        btn.style.background = 'linear-gradient(135deg,#1a5276 0%,#2980b9 100%)';
        btn.disabled = false;
      }, 3000);
    }
  }

  function getLevelColor(level) {
    switch(level) {
      case 'A': return {r:45,g:139,b:87};
      case 'B': return {r:46,g:117,b:182};
      case 'C': return {r:230,g:126,b:34};
      default:  return {r:204,g:68,b:68};
    }
  }

  function getBarColor(pct) {
    if (pct >= 60) return {r:45,g:139,b:87};
    if (pct >= 40) return {r:230,g:126,b:34};
    return {r:204,g:68,b:68};
  }

})();
