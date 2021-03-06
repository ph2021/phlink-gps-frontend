import qs from 'qs'

/**
 * WebUtil常用的一些工具类
 */

export function formatData(arr) {
  const params = new URLSearchParams()
  for (const key in arr) {
    params.append(key, arr[key])
  }
  return params
}

export function formatDataToJson(arr) {
  var params = '['
  for (var key in arr) {
    params = params + key + ':' + arr[key] + ','
  }
  params += ']'
  return params
}

export function formatDataToForm(arr) {
  const params = new FormData()
  for (var key in arr) {
    console.log('"' + key + '"', arr[key])
    params.append('"' + key + '"', arr[key])
  }
  return params
}

export function getPar(data) {
  return qs.stringify(data)
}

export function guid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0
    var v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export function getUrlKey(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.href) || [''])[1].replace(/\+/g, '%20')) || null
}
