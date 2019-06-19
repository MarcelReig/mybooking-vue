require(['jquery', 'YSDRemoteDataSource','YSDSelectSelector','commonServices',
        'ysdtemplate',
        'jquery.validate', 'jquery.ui', 'jquery.ui.datepicker-es',
        'jquery.ui.datepicker-en', 'jquery.ui.datepicker-ca', 'jquery.ui.datepicker-it',
        'jquery.ui.datepicker.validation', 'jquery.form',  'datejs'],
    function($, RemoteDataSource, SelectSelector,commonServices, tmpl) {

  var model = { // THE MODEL
    defaultLanguage: 'es',
    requestLanguage: null,
    bookingFreeAccessId : null,
    booking: null,
    products: null,
    sales_process: null,

    // ------------ Product information detail ------------------------

    getUrlVars : function() {
      var vars = [], hash;
      var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
      for(var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
      }
      return vars;
    },

    extractVariables: function() { // Load variables from the request

      var url_vars = this.getUrlVars();

      this.bookingFreeAccessId = decodeURIComponent(url_vars['id']);
      this.requestLanguage = decodeURIComponent(url_vars['lang']);
      if (this.requestLanguage == 'undefined') {
        this.requestLanguage = model.defaultLanguage;
      }
    },

    getBookingProduct: function() { /** Get a product **/

      if (this.booking && this.booking.booking_lines.length > 0)
      {
         var productCode = this.booking.booking_lines[0].item_id;
         if (this.products == null) {
           return null;
         }
         for (var idx=0;idx<=this.products.length;idx++) {
           if (this.products[idx].code == productCode) {
             return this.products[idx];
           }
         }
      }

      return null;

    },

    // ----------------- Reservation ------------------------------

    getBookingFreeAccessId: function() { /* Get the booking id */
      return sessionStorage.getItem('booking_free_access_id');
    },

    setBookingFreeAccessId: function(bookingFreeAccessId) { /* Set the booking id */
      sessionStorage.setItem('booking_free_access_id', bookingFreeAccessId);
    },

    loadBooking: function() { /** Load the reservation **/

       var bookingId = this.bookingFreeAccessId;

       if (bookingId == '') {
         bookingId = this.getBookingFreeAccessId();
       }

       // Build the URL
       var url = commonServices.URL_PREFIX + '/api/booking/frontend/booking/' +
                 bookingId;
        if (model.requestLanguage != null) {
            url += '?lang=' + model.requestLanguage;
        }

       // Action to the URL
       $.ajax({
               type: 'GET',
               url : url,
               dataType : 'json',
               contentType : 'application/json; charset=utf-8',
               //xhrFields: {
               //  withCredentials: true
               //},
               crossDomain: true,
               success: function(data, textStatus, jqXHR) {

                 if (model.requestLanguage != data.booking.customer_language &&
                     data.booking.customer_language != null &&
                     data.booking.customer_language != '') {
                   window.location.href = '/summary.html?id='+data.booking.free_access_id+'&lang='+data.booking.customer_language;
                 }
                 else {
                   model.booking = data.booking;
                   model.products = data.products;
                   model.sales_process = data.sales_process;
                   view.updateBooking();
                 }

               },
               error: function(data, textStatus, jqXHR) {

                 alert('Error cargando reserva');

               },
               complete: function(jqXHR, textStatus) {
                 $('#full_loader').hide();
                 $('#content').show();
                 $('#sidebar').show();
               }
          });
    },

    sendPayRequest: function(paymentMethod) {

      var bookingId = this.bookingFreeAccessId;

      if (bookingId == '') {
        bookingId = this.getBookingFreeAccessId();
      }
      else {
        this.setBookingFreeAccessId(bookingId);
      }

      $.form(commonServices.URL_PREFIX + '/reserva/pagar',{
          id: bookingId,
          payment: 'deposit',
          payment_method_id: paymentMethod,
        },'POST').submit();
    }

  };

  var controller = { // THE CONTROLLER
    btnPaymentClick: function() {
       model.sendPayRequest();
    }
  };

  var view = { // THE VIEW

    init: function() {
      model.extractVariables();
      $('#full_loader').show();
      model.loadBooking();
    },

    updateBooking: function() { // Updates the shopping cart

      this.updateTitle();
      this.updateProduct();
      this.updateBookingSummary();
      this.updateExtras();
      this.updateCustomer();

    },

    updateTitle: function() {
      $('#reservation_title').html(model.booking.summary_status);
    },

    updateProduct: function() {
      var productInfo = tmpl('script_product_detail')(
                    {product: model.getBookingProduct(),
                     booking: model.booking});
      $('#selected_product').html(productInfo);
    },

    updateBookingSummary: function() { // Updates the shopping cart summary (total)

       var reservationDetail = tmpl('script_reservation_summary')(
            {booking: model.booking});
       $('#reservation_detail').html(reservationDetail);

       // If the booking is pending show the payment controls
       if (model.booking.status == 'pending_confirmation' && model.sales_process.can_pay) {
         var paymentInfo = tmpl('script_payment_detail')(
          {
            model: model
          });
         $('#payment_detail').html(paymentInfo);
         $('#btn_pay').bind('click', function(){
            var paymentMethod = $('#accordion a').not('.collapsed').attr('data-payment-method');
            if (paymentMethod != null && paymentMethod != 'undefined') {
              controller.btnPaymentClick(paymentMethod);
            }
            else {
              alert('Por favor, seleccione la forma de pago');
            }
         });
       }

    },

    updateExtras: function() { // Updates the extras (included the selected by the transaction)

      // Show the extras
      if (model.booking.booking_extras.length > 0) {
        var extrasInfo = tmpl('script_extras_detail')(
                    {booking: model.booking});
        $('#selected_extras').html(extrasInfo);
      }
    },

    updateCustomer: function() { // Updates the extras (included the selected by the transaction)

        // Show the extras
      var customerInfo = tmpl('script_customer_data')(
                    {booking: model.booking});
      $('#customer_data').html(customerInfo);
    },

  };

  view.init();

});
