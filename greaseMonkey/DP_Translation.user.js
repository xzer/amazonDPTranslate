// ==UserScript==
// @name         Amazon DP Translation
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://*.amazon.com/*/dp/*
// @match        https://*.amazon.com/dp/*
// @match        https://*.amazon.com/gp/product/*
// @match        https://*.amazon.com/product-reviews*
// @match        https://*.amazon.in/*/dp/*
// @match        https://*.amazon.in/dp/*
// @match        https://*.amazon.in/gp/product/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';
  let authCode = localStorage.getItem('dp-translation-authCode');
  if (!authCode) {
    alert('no dp-translation-authCode!');
    return;
  }

  let gateway = localStorage.getItem('dp-translation-gateway');
  if (!gateway) {
    alert('no dp-translation-gateway!');
    return;
  }

  let targetLang = localStorage.getItem('dp-translation-lang');
  if (!targetLang) {
    targetLang = 'zh';
  }

  P.when('A').execute('dp translation monkey', function(A){
    let $ = A.$;
    let callTranslation = function(text, cb) {
      if (!text || !cb) return;
      $.ajax({
        method: 'get',
        url: 'https://'+gateway+'.execute-api.us-west-2.amazonaws.com/beta/translation?authCode='+authCode+'&text=' + encodeURI(text) + '&target_language=' + targetLang,
        dataType: 'text',
        accepts: {
          text: 'text/plain'
        }
      }).done(function(data){
        cb($('<p style="color:#00CD66">'+data+'</p>'));
      });
    };
    let doTranslation = function($target){
      $target.each(function(idx, elem){
        let $elem = $(elem);
        callTranslation($elem.text(), function(translated){
          $elem.append(translated);
        });
      });
    };
    let doTranslationWithRetry = function(selector, retry){
      let $target = $(selector);
      if ($target.length > 0){
        doTranslation($target);
      } else {
        console.log(selector + ' is not found, retry:', retry);
        if (retry > 0) {
          setTimeout(function(){
            doTranslationWithRetry(selector, retry - 1);
          }, 1000);
        }
      }
    };

    let doTranslationForBtf = function(btfSelector, selector){
      let $btf = $(btfSelector);
      if ($btf.length > 0){
        doTranslationWithRetry(selector, 5);
      } else {
        console.log(btfSelector + ' is not loading, waiting...');
        setTimeout(function(){
          doTranslationForBtf(btfSelector, selector);
        }, 3000);
      }
    };
    ['#feature-bullets li',
     '#dp-container p',
     "#descriptionAndDetails p",
     '#cm-cr-dp-review-list div[id^="customer_review-"] a[data-hook=review-title]',
     '#cm-cr-dp-review-list div[id^="customer_review-"] span[data-hook="review-body"] div[data-hook="review-collapsed"]'
    ].forEach(function(selector){
      doTranslationWithRetry(selector, 5);
    });

    [
     ['#ask-btf_feature_div div[id^="question-"]', '#ask-btf_feature_div div[id^="question-"] a[href^="/ask/questions"]'],
     ['#ask-btf_feature_div div[id^="question-"]', '#ask-btf_feature_div div[id^="question-"] + div div.a-col-right span'],
    ].forEach(function(selectors){
      doTranslationForBtf(selectors[0], selectors[1]);
    });
  });
})();
