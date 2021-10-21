FS = require("fs");

Path = require("path");

JSONDB = require("node-json-db");

JSONConfig = require("node-json-db/dist/lib/JsonDBConfig");

  class galleryCache {
    constructor() {
      this.Storage = new JSONDB.JsonDB(new JSONConfig.Config("./Cache/MiyukiBot", true, false));
      this.Storage.push("/ids","");
    }
  
    getCache(Store) {
      var Data, E;
      try {
        Data = this.Storage.getData("/")[`${Store.replace("/", "")}`];
        if (typeof Data !== "undefined") {
          return Data;
        } else {
          return false;
        }
      } catch (error) {
        E = error;
        throw E;
      }
    }
  
    setCache(Store, Data) {
      var E;
      try {
        return this.Storage.push(Store, Data,false);
      } catch (error) {
        E = error;
        throw E;
      }
    }
    deleteCache(Store) {
      var E;
      try {
        return this.Storage.delete(Store);
      } catch (error) {
        E = error;
        throw E;
      }
    }
  }
  module.exports =  galleryCache