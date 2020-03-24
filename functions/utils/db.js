
module.exports = {

  /**
   * Makes sure the given string does not contain characters that can't be used as Firebase
   * Realtime Database keys such as '.' and replaces them by '*'.
   */
  makeKeyFirebaseCompatible:(key)=>{
    return key.replace(/\./g, '*');
  },

}
