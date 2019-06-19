define('YSDAbstractDataSource', ['YSDEventTarget','YSDDataAdapter'], function(YSDEventTarget, DataAdapter) {

 var YSDAbstractDataSource = function() {

   this.events = new YSDEventTarget();

   this.addListener = function(type, listener) { /* addListener */
     this.events.addEventListener(type, listener);
   }

   this.removeListener = function(type, listener) { /* removeListener */
     this.events.removeEventListener(type, listener);
   }

   this.adaptData = function(data, matchingProperties, adapters) {

   	 var adapted_data = [];

     if (matchingProperties != null)
     {
       for (var idx in data) {
         adapted_data.push(new DataAdapter(data[idx], matchingProperties));
       }
     }
     else
     {
       adapted_data = data;
     }

  	 // Adapt data through extra adapters
     for (var idx in adapters) {
       adapted_data = new adapters[idx](adapted_data);
     }

  	 return adapted_data;

  }
 }

 return YSDAbstractDataSource;

 });
