(function(algolia) {
  'use strict';
  const render = algolia.externals.render;
  const html = algolia.externals.html;

  var algoliasearch = algolia.externals.algoliasearch;
  algolia.searchClient = algoliasearch(
          algolia.config.app_id,
          algolia.config.search_api_key
  );

  algolia.render = (template, container, data) => {
    return render(template(html, data), container);
  };

  var formatPrice = function formatPrice(value, currency = false) {
    return algolia.formatMoney(Number(value) * 100, currency);
  };

  var escapeHtml = function escapeHtml(unsafe) {
    return (unsafe || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  algolia.helpers = {
    marketsEnabled: function marketsEnabled() {
      return algolia.config.markets_indexing_enabled && algolia.config.markets_mapping?.length ? true : false;
    },
    activeCurrencyCode: function activeCurrencyCode() {
      return Shopify.currency.active.toLowerCase();
    },
    formatNumber: function formatNumber(val) {
      return Number(val).toLocaleString();
    },
    localizeHitData: hit => {
      if (algolia.helpers.marketsEnabled()) {
        hit.currency = algolia.config.store_currency.toLowerCase();
      }
      
      if (!algolia.helpers.marketsEnabled() || algolia.helpers.activeCurrencyCode() === algolia.config.store_currency.toLowerCase()) {
        return hit;
      }
      const currencyKey = `market_pricing_${algolia.helpers.activeCurrencyCode()}`;

      if (currencyKey in hit) {
        hit.price = hit[currencyKey]?.price || hit.price;
        hit.compare_at_price = hit[currencyKey]?.compare_at_price || hit.compare_at_price;
        hit.variants_min_price = hit[currencyKey]?.variants_min_price || hit.variants_min_price;
        hit.variants_max_price = hit[currencyKey]?.variants_max_price || hit.variants_max_price;
        hit.variants_compare_at_price_min = hit[currencyKey]?.variants_compare_at_price_min || hit.variants_compare_at_price_min;
        hit.variants_compare_at_price_max = hit[currencyKey]?.variants_compare_at_price_max || hit.variants_compare_at_price_max;
        hit.price_ratio = hit[currencyKey]?.price_ratio || hit.price_ratio;
        hit.currency = currencyKey.split('_').pop();
      }

      return hit;
    },
    displayPrice: function displayPrice(item, distinct) {
      if (distinct) {
        var min = item.variants_min_price;
        var max = item.variants_max_price;
        var currency = item.currency || false;
        if (min && max && min !== max) {
          return  formatPrice(min, currency) + ' - ' + formatPrice(max, currency);
        }
      }
      return formatPrice(item.price, item.currency);
    },
    displayStrikedPrice: function displayStrikedPrice(price, compare_at_price, currency) {
      const comparing =
        Number(compare_at_price) && Number(compare_at_price) > Number(price);
      if (comparing) { return formatPrice(compare_at_price, currency) }
    },
    displayDiscount: function displayDiscount(price, compare_at_price, price_ratio) {
      const comparing = Number(compare_at_price) && Number(compare_at_price) > Number(price);
      const discount_ratio = 1.0 - price_ratio;
      if (comparing) { return `- ${Math.floor(discount_ratio * 100)} %`}
    },
    instantsearchLink: function instantsearchLink(hit) {
      const addVariantId = !hit._distinct && hit.objectID !== hit.id;
      return (
        Shopify.routes.root +
        'products/' +
        hit.handle +
        (addVariantId ? '?variant=' + hit.objectID : '')
      );
    },
    fullTitle: function fullTitle(title, distinct, variant_title) {
      var res = title;
      if (
        !distinct &&
        variant_title &&
        variant_title !== 'Default Title' &&
        variant_title !== 'Default'
      ) {
        res += ' (' + variant_title + ')';
      }

      return escapeHtml(res);
    },
    variantTitleAddition: function variantTitleAddition(item, distinct) {
      var res = ' ';
      if (
        !distinct &&
        item.variant_title &&
        item.variant_title !== 'Default Title' &&
        item.variant_title !== 'Default'
      ) {
        res += `( ${item.variant_title} )`;
      }
      return res;
    },
    hexToRGB: function hexToRGB(hex){
      if (!hex) return ``;
      if(hex.length== 4){
        hex = hex.substring(1).replace(/./g, '$&$&')
      }
      var m = hex.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
      return `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}`;
    },
    sizedImage: function sizedImage(sizeInput, item, _distinct) {
      var image = _distinct ? item.product_image : item.image;
      if (!image) {
        return 'http://cdn.shopify.com/s/images/admin/no-image-compact.gif';
      }
      var size = sizeInput.replace(/^\s+|\s+$/g, ''); // Render and trim
      if (size === 'original') {
        return image;
      }
      return image.replace(/\/(.*)\.(\w{2,4})/g, '/$1_' + size + '.$2');
    },
    index_suffix: (function () {
      const ALGOLIA_MARKET_KEY = 'algolia_market';
      let cache_suffix = '';
      let isMemoized = false;

      return async function memorizedIndexSuffix() {
        if (isMemoized) return cache_suffix;

        if (algolia.config.markets_indexing_enabled && algolia.config.markets_mapping?.length) {
          // Check if market has changed, if changed, update market
          let shouldCheckMarketIndex = true;
          try {
            const marketStorage = JSON.parse(localStorage.getItem(ALGOLIA_MARKET_KEY) || '{}');
            
            if (
              marketStorage.id == algolia.shopify.market.id && 
              marketStorage.locale == algolia.shopify.market.language.shop_locale.locale
            ) {
              cache_suffix = marketStorage.suffix ? `_${marketStorage.suffix}` : '';
              shouldCheckMarketIndex = false;
              isMemoized = true;
            } 
          } catch (e) {
            localStorage.removeItem(ALGOLIA_MARKET_KEY);
            cache_suffix = '';
            isMemoized =true;
          }
          
          if(shouldCheckMarketIndex) {
            try {
              // key = {market_id}_{market_language}
              const key = `${algolia.shopify.market.id}_${algolia.shopify.market.language.shop_locale.locale}`;
              const market = algolia.config.markets_mapping.find(market => market.key === key);
              if(market) {
                const indexSuffix = market.suffix ? `_${market.suffix}` : '';

                // indexName = {prefix}_{type}_{market_title}_{language_code}
                const indexName = `${algolia.config.index_prefix}products${indexSuffix}`;
                const index = algolia.searchClient.initIndex(indexName);

                await index.search('', { 
                  page: 1, 
                  hitsPerPage: 1,
                  analytics: false, 
                });
                cache_suffix = indexSuffix;
                localStorage.setItem(ALGOLIA_MARKET_KEY, JSON.stringify(market));
                isMemoized = true;
              }
            } catch (e) {
              localStorage.removeItem(ALGOLIA_MARKET_KEY);
              cache_suffix = '';
              isMemoized = true;
            }
          }
          return cache_suffix;
        }
        else {
          return cache_suffix;
        }
      }
    })(),
  };

  algolia.config.index_suffix = algolia.helpers.index_suffix();

  [
    'pico',
    'icon',
    'thumb',
    'small',
    'compact',
    'medium',
    'large',
    'grande',
    'original'
  ].forEach(function(size) {
    algolia.helpers[size + 'Image'] = function(item) {
        var image = item.distinct ? item.product_image : item.image;

        if (!image) {
          return 'http://cdn.shopify.com/s/images/admin/no-image-compact.gif';
        }

        if (size === 'original') {
          return image;
        }

        return image.replace(/\/(.*)\.(\w{2,4})/g, '/$1_' + size + '.$2');
    };
  });
})(window.algoliaShopify);
