// adding the convert script to head
if (typeof _conv_host == 'undefined') {
  window['_conv_prevent_bodyhide'] = true
  window['_conv_page_type'] = 'order_confirmation'

  const isInjected = Array.prototype.slice
    .apply(document.getElementsByTagName('script'))
    .some((el) =>
      el.src.includes(
        'cdn-4.convertexperiments.com/v1/js/10007840-10007526.js'
      )
    )
  if (!isInjected) {
    let _conv_track = document.createElement('script')
    _conv_track.src =
      '//cdn-4.convertexperiments.com/v1/js/10007840-10007526.js'
    document.getElementsByTagName('head')[0].appendChild(_conv_track)
  }
}

// doing logic to submit track conversions
if (Shopify?.Checkout?.step === 'thank_you') {
  console.debug('Convert: We are on the thank you page')

  const revenue_goal_id = localStorage.getItem('convert_revenue_goal')

  if (revenue_goal_id) {
    console.log('%cConvert: We have revenue goal', 'color: lightgreen')

    window['_conv_q'] = window['_conv_q'] || [];
    window['_conv_q'].push({
      what: 'pushRevenue',
      params: {
        forceMultiple: true,
        goalId: revenue_goal_id,
        transactionId: Shopify?.checkout?.token,
        amount: parseFloat(Shopify?.checkout?.subtotal_price),
        productsCount: Shopify?.checkout?.line_items?.reduce((acc, item) => {
          return acc + item.quantity
        }, 0)
      }
    })
  }
}
