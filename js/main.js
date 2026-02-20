/* ============================================
   持ち家の給付金診断サイト - メインJS
   ============================================ */

(function () {
  'use strict';

  // ---------- 要素取得 ----------
  var shindanSection = document.getElementById('js-shindan');
  var cardsContainer = document.getElementById('js-cards');
  var dotsContainer = document.getElementById('js-dots');
  var stepCurrentEl = document.getElementById('js-step-current');
  var backBtn = document.getElementById('js-back');
  var resultOverlay = document.getElementById('js-result-overlay');
  var ineligibleOverlay = document.getElementById('js-ineligible-overlay');
  var ineligibleCloseBtn = document.getElementById('js-ineligible-close');
  var floatingCta = document.getElementById('js-floating-cta');
  var floatingText = document.getElementById('js-floating-text');

  // 診断スタート/スクロールボタン（全てスクロール誘導）
  var startButtons = [
    document.getElementById('js-start-top'),
    document.getElementById('js-start-trust'),
    document.getElementById('js-start-floating'),
  ];

  // ---------- 状態管理 ----------
  var currentStep = 1;
  var totalSteps = 9;
  var answers = {};
  var isTransitioning = false;
  var isPopstateHandling = false;

  // ---------- 診断モード切替 ----------
  function enterDiagnosticMode() {
    document.body.classList.add('is-diagnostic-mode');
    window.scrollTo(0, 0);
  }

  function exitDiagnosticMode() {
    document.body.classList.remove('is-diagnostic-mode');
    clearHash();
  }

  // ---------- ハッシュルーティング ----------
  function updateHash(step) {
    if (step === '0a') {
      history.pushState({ step: '0a' }, '', '#step0a');
    } else if (step >= 2) {
      history.pushState({ step: step }, '', '#step' + step);
    } else {
      clearHash();
    }
  }

  function clearHash() {
    if (location.hash) {
      history.pushState({ step: 1 }, '', location.pathname + location.search);
    }
  }

  // ページ読込時: 回答データがないハッシュは除去してQ1表示
  (function handleInitialHash() {
    var hash = location.hash;
    if (/^#step([2-9]|0a)$/.test(hash)) {
      history.replaceState({ step: 1 }, '', location.pathname + location.search);
    }
  })();

  // ブラウザ戻る/進むボタン対応
  window.addEventListener('popstate', function (e) {
    var state = e.state;
    var targetStep = (state && state.step) ? state.step : 1;

    // ハッシュからもステップを判定（フォールバック）
    if (!state) {
      var hash = location.hash;
      if (hash === '#step0a') {
        targetStep = '0a';
      } else {
        var match = hash.match(/^#step(\d+)$/);
        if (match) {
          targetStep = parseInt(match[1], 10);
        } else {
          targetStep = 1;
        }
      }
    }

    isPopstateHandling = true;

    if (targetStep === '0a') {
      // 結果ページに戻る場合 → 回答データがなければQ1へ
      if (Object.keys(answers).length > 0) {
        showResult();
      } else {
        currentStep = 1;
        showCard(currentStep);
        exitDiagnosticMode();
      }
    } else if (targetStep <= 1) {
      // 結果モーダルが開いていれば閉じる
      resultOverlay.classList.remove('is-active');
      document.body.style.overflow = '';
      currentStep = 1;
      showCard(currentStep);
      exitDiagnosticMode();
    } else {
      // 結果モーダルが開いていれば閉じる
      resultOverlay.classList.remove('is-active');
      document.body.style.overflow = '';
      currentStep = targetStep;
      showCard(currentStep);
      if (!document.body.classList.contains('is-diagnostic-mode')) {
        enterDiagnosticMode();
      }
    }

    isPopstateHandling = false;
  });

  // ---------- 診断セクションへスクロール ----------
  function scrollToShindan() {
    shindanSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  startButtons.forEach(function (btn) {
    if (btn) {
      btn.addEventListener('click', scrollToShindan);
    }
  });

  // ---------- プログレス更新 ----------
  function updateProgress() {
    stepCurrentEl.textContent = currentStep;
    var dots = dotsContainer.querySelectorAll('.shindan__dot');
    dots.forEach(function (dot, i) {
      var step = i + 1;
      dot.classList.remove('shindan__dot--done', 'shindan__dot--current');
      if (step < currentStep) {
        dot.classList.add('shindan__dot--done');
      } else if (step === currentStep) {
        dot.classList.add('shindan__dot--current');
      }
    });
  }

  // ---------- カード切り替え ----------
  function showCard(step) {
    var cards = cardsContainer.querySelectorAll('.shindan__card');
    cards.forEach(function (card) {
      card.classList.remove('shindan__card--active');
    });
    var targetCard = cardsContainer.querySelector('[data-question="' + step + '"]');
    if (targetCard) {
      targetCard.classList.add('shindan__card--active');
    }
    updateProgress();
    updateBackButton();
    if (document.body.classList.contains('is-diagnostic-mode')) {
      window.scrollTo(0, 0);
    } else {
      shindanSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ---------- 戻るボタン表示制御 ----------
  function updateBackButton() {
    if (currentStep <= 1) {
      backBtn.style.visibility = 'hidden';
    } else {
      backBtn.style.visibility = 'visible';
    }
  }
  updateBackButton();

  // ---------- フローティングCTAテキスト切り替え ----------
  var hasStarted = false;
  function updateFloatingText() {
    if (hasStarted) {
      floatingText.textContent = 'Web診断を再開';
    } else {
      floatingText.textContent = '診断スタート';
    }
  }

  function goToNext() {
    if (currentStep < totalSteps) {
      currentStep++;
      showCard(currentStep);
      if (!isPopstateHandling) {
        updateHash(currentStep);
      }
      if (currentStep >= 2) {
        enterDiagnosticMode();
      }
    } else {
      showResult();
    }
  }

  function goToPrev() {
    if (currentStep > 1) {
      currentStep--;
      showCard(currentStep);
      if (!isPopstateHandling) {
        updateHash(currentStep);
      }
      if (currentStep <= 1) {
        exitDiagnosticMode();
      }
    }
  }

  // ---------- 対象外判定 ----------
  var ineligibleValues = {
    q1: ['持ち家（マンション）', '賃貸'],
    q2: ['いいえ']
  };

  function showIneligible() {
    ineligibleOverlay.classList.add('is-active');
    document.body.style.overflow = 'hidden';
  }

  function hideIneligible() {
    ineligibleOverlay.classList.remove('is-active');
    document.body.style.overflow = '';
    // 診断モード解除 + ハッシュクリア
    exitDiagnosticMode();
    // Q1に戻す
    currentStep = 1;
    showCard(currentStep);
    // 回答リセット
    answers = {};
    hasStarted = false;
    updateFloatingText();
    document.querySelectorAll('.shindan__option-radio').forEach(function (btn) {
      btn.classList.remove('is-selected');
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  ineligibleCloseBtn.addEventListener('click', hideIneligible);

  // ---------- 単一選択（Q1, Q2） ----------
  var radioButtons = document.querySelectorAll('.shindan__option-radio');
  radioButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (isTransitioning) return;

      var q = this.getAttribute('data-q');
      var value = this.getAttribute('data-value');

      // 同じ質問の選択状態をリセット
      var siblings = document.querySelectorAll('[data-q="' + q + '"].shindan__option-radio');
      siblings.forEach(function (s) {
        s.classList.remove('is-selected');
      });
      this.classList.add('is-selected');

      answers['q' + q] = value;
      isTransitioning = true;

      if (!hasStarted) {
        hasStarted = true;
        updateFloatingText();
      }

      // 対象外チェック
      var qKey = 'q' + q;
      if (ineligibleValues[qKey] && ineligibleValues[qKey].indexOf(value) !== -1) {
        setTimeout(function () {
          showIneligible();
          isTransitioning = false;
        }, 300);
        return;
      }

      // 少し遅延して次へ
      setTimeout(function () {
        goToNext();
        isTransitioning = false;
      }, 300);
    });
  });

  // ---------- 複数選択（Q3〜Q9）チェックボックス制御 ----------
  var checkboxLabels = document.querySelectorAll('.shindan__option-check');
  checkboxLabels.forEach(function (label) {
    var checkbox = label.querySelector('input[type="checkbox"]');
    if (!checkbox) return;

    checkbox.addEventListener('change', function () {
      var name = this.name;
      var isNone = this.hasAttribute('data-none');

      if (isNone && this.checked) {
        // 「特にない」を選んだら他を全解除
        var others = document.querySelectorAll('input[name="' + name + '"]:not([data-none])');
        others.forEach(function (other) {
          other.checked = false;
          other.closest('.shindan__option-check').classList.remove('is-checked');
        });
      } else if (!isNone && this.checked) {
        // 他を選んだら「特にない」を解除
        var noneCheckbox = document.querySelector('input[name="' + name + '"][data-none]');
        if (noneCheckbox) {
          noneCheckbox.checked = false;
          noneCheckbox.closest('.shindan__option-check').classList.remove('is-checked');
        }
      }

      // チェック状態のUIを更新
      if (this.checked) {
        label.classList.add('is-checked');
      } else {
        label.classList.remove('is-checked');
      }
    });
  });

  // ---------- 「次へ」ボタン ----------
  var nextButtons = document.querySelectorAll('.btn-next');
  nextButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var q = this.getAttribute('data-q');
      var checked = document.querySelectorAll('input[name="q' + q + '"]:checked');
      var values = [];
      checked.forEach(function (c) {
        values.push(c.value);
      });
      answers['q' + q] = values;
      goToNext();
    });
  });

  // ---------- 戻るボタン ----------
  backBtn.addEventListener('click', goToPrev);

  // ---------- スコア計算 ----------
  // Q1,Q2は対象外選定用のため点数なし
  // Q3〜Q9: 「特にない」以外が1つでもあれば1点（各問最大1点、合計最大7点）
  function calculateScore() {
    var score = 0;

    for (var i = 3; i <= 9; i++) {
      var qAnswers = answers['q' + i] || [];
      var hasIssue = qAnswers.some(function (a) {
        return a !== '特にない';
      });
      if (hasIssue) {
        score += 1;
      }
    }

    return score;
  }

  // 2点以上→高、1点→中、0点→低
  function getResultLevel(score) {
    if (score >= 2) return 'high';
    if (score === 1) return 'mid';
    return 'low';
  }

  // レベル別LINE遷移先
  var lineUrls = {
    high: 'https://s.lmes.jp/landing-qr/2008240489-BzqNLedd?uLand=EBESpW',
    mid:  'https://s.lmes.jp/landing-qr/2008240489-BzqNLedd?uLand=xU7t6F',
    low:  'https://s.lmes.jp/landing-qr/2008240489-BzqNLedd?uLand=VdukkE'
  };

  // ---------- 結果表示 ----------
  function showResult() {
    var score = calculateScore();
    var level = getResultLevel(score);

    // LINEボタンのリンク先を設定
    var lineBtn = document.getElementById('js-line-btn');
    lineBtn.href = lineUrls[level];

    // 最終ページをstep0aとしてハッシュに記録
    if (!isPopstateHandling) {
      updateHash('0a');
    }

    resultOverlay.classList.add('is-active');
    document.body.style.overflow = 'hidden';
  }

  // ---------- フローティングCTA表示制御 ----------
  // 診断セクションが画面内にあるときは非表示、画面外のときに表示
  function handleFloatingCta() {
    var rect = shindanSection.getBoundingClientRect();
    var shindanVisible = rect.top < window.innerHeight && rect.bottom > 0;
    var scrollY = window.scrollY || window.pageYOffset;

    if (shindanVisible || scrollY < 200) {
      floatingCta.classList.add('is-hidden');
    } else {
      floatingCta.classList.remove('is-hidden');
    }
  }

  // 初期状態で非表示
  floatingCta.classList.add('is-hidden');

  // ---------- スクロールイベント最適化 ----------
  var scrollTicking = false;
  function onScroll() {
    if (!scrollTicking) {
      requestAnimationFrame(function () {
        handleFloatingCta();
        handleScrollAnimation();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // ---------- FAQ アコーディオン ----------
  var faqButtons = document.querySelectorAll('.faq__question');
  faqButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var expanded = this.getAttribute('aria-expanded') === 'true';
      var answer = this.nextElementSibling;

      // 他を閉じる
      faqButtons.forEach(function (otherBtn) {
        otherBtn.setAttribute('aria-expanded', 'false');
        otherBtn.nextElementSibling.classList.remove('is-open');
      });

      if (!expanded) {
        this.setAttribute('aria-expanded', 'true');
        answer.classList.add('is-open');
      }
    });
  });

  // ---------- スクロールアニメーション ----------
  function handleScrollAnimation() {
    var elements = document.querySelectorAll('.fade-up');
    elements.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.85) {
        el.classList.add('is-visible');
      }
    });
  }

  handleScrollAnimation();

  // ---------- GTMイベント送信（将来用） ----------
  function trackEvent(eventName, data) {
    if (typeof window.dataLayer !== 'undefined') {
      window.dataLayer.push(Object.assign({ event: eventName }, data || {}));
    }
  }

})();
