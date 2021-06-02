/*
* Base64 Decoding
* Made by Adam K Dean (https://dev.to/adamkdean)
* Modified by PANCHO7532 to allow custom charsets and paddings dynamically by parameters
*/
String.prototype.fromBase64 = function(charsetString, paddingString) {
    if(!charsetString) {
      charsetString = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    }
    if(!paddingString) {
      paddingString = "=";
    }
    const base64chars = charsetString;
    let result = '',
        encoded = '';
  
    // step 1. convert base64chars into reverse lookup object
    const base64inv = {};
    for (let i = 0; i < base64chars.length; i++)
      base64inv[base64chars[i]] = i;
  
    // step 2. remove any characters that are not base64 or padding
    const base64regex = new RegExp(`[^${base64chars}=]`, 'g');
    encoded = this.replace(base64regex, '');
  
    // step 3. replace padding at the end with A (remember, A equals zero)
    const onePadding = encoded.charAt(encoded.length - 1) === paddingString;
    const twoPadding = encoded.charAt(encoded.length - 2) === paddingString;  
    const padding = onePadding ? twoPadding ? 'AA' : 'A' : '';
    encoded = encoded.substring(0, encoded.length - padding.length) + padding;
  
    // step 4. iterate over the encoded string, four characters at a time
    for (let i = 0; i < encoded.length; i += 4) {
  
      // step 5. convert the four base64 characters into 6-bit numbers using
      //         the base64 character -> 6-bit number map above
      const dn = base64inv[encoded.charAt(i)];
      const en = base64inv[encoded.charAt(i + 1)];
      const fn = base64inv[encoded.charAt(i + 2)];
      const gn = base64inv[encoded.charAt(i + 3)];
  
      // step 6. convert these four 6-bit numbers into  one 24-bit number
      //
      // if you remember from before, we split a 24-bit number into four 6-bit numbers:
      //
      // e.g.   00001111 00000101 00001010
      // to     |----||- ---||--- -||----|
      //         d     e      f      g
      //
      // d =    00000000 00000000 00000011
      // e =    00000000 00000000 00110000
      // f =    00000000 00000000 00010100
      // g =    00000000 00000000 00001010
      //
      //
      // we need to left shift them (<<) so that they all line up
      // 
      // 00000000 00000000 00XXXXXX (we have four of these)
      // DDDDDDEE EEEEFFFF FFGGGGGG (we want one of these)        
      const d = dn << 18;      // DDDDDD00 00000000 00000000
      const e = en << 12;      // 000000EE EEEE0000 00000000
      const f = fn << 6;       // 00000000 0000FFFF FF000000
      const g = gn;            // 00000000 00000000 00GGGGGG
      const n = d + e + f + g; // DDDDDDEE EEEEFFFF FFGGGGGG (yay!)
  
      // step 7. split this 24-bit number into three 8-bit (ASCII) characters
      //
      // if you remember, we had three of these (8-bit): 00000000
      // and we actually wanted one of these (24-bit): 00000000 00000000 00000000
      //
      // to get this, we shift the first number 16 bits left, and the second, 8 bits left:
      //
      // 00000000 <------- -------- first char << 16
      //          00000000 <------- second char << 8
      //                   00000000 third char (no shift)
      //
      // so now we want to reverse this and reclaim our three 8-bit (ASCII) characters,
      // we can do this by shifting the numbers back over to the right, and applying a
      // 255 value logical AND (&) bit mask to ignore anything in the 16 bits on the left
      //
      // e.g.   00001111 00000101 00001010
      // to     |------| |------| |------|
      //         a        b        c
      //
      // >>> 16 00000000 00000000 00001111
      // & 255  00000000 00000000 11111111
      // a =    00000000 00000000 00001111
      //                            
      // >>> 8  00000000 00001111 00000101
      // & 255  00000000 00000000 11111111
      // b =    00000000 00000000 00000101
      //
      // noop   00001111 00000101 00001010
      // & 255  00000000 00000000 11111111
      // c =    00000000 00000000 00001010
      const a = (n >>> 16) & 255;
      const b = (n >>> 8) & 255;
      const c = n & 255;
  
      // step 8. turn these three 8-bit numbers into ASCII characters, and append to result
      result += String.fromCharCode(a, b, c);
    }
  
    // step 8. finally, remove any padding that was previously added to make this a multiple of 3
    return result.substring(0, result.length - padding.length);
};