window.mybookingEngine = (function() {
  var baseURL = "https://demo-tours.mybooking.es";
  var apiKey = "";
  var shoppingCartUrl = "activity-shopping-cart.html";
  var orderUrl = "activity-summary.html";
  function getBaseURL() {
    return baseURL;
  }
  function getApiKey() {
    return apiKey;
  }
  function getShoppingCartUrl() {
    return shoppingCartUrl;
  }
  function getOrderUrl() {
    return orderUrl;
  }
  return {
    baseURL: getBaseURL,
    apiKey: getApiKey,
    shoppingCartUrl: getShoppingCartUrl,
    orderUrl: getOrderUrl
  };
})();
