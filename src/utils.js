
/**
 * Prototype
 */

module.exports = {

  /**
   * Return whether a given string is decodable JSON
   *
   * @return {Boolean}
   * @api public
  */

  isJSON: function(str) {
    try {
      JSON.parse(str);
    } catch(e) {
      return false;
    }
    return true;
  },

}