/**
 *
 * @param res
 */
export const httpSuccess = (res) => res.status === 200;

/**
 *
 * @param time
 * @param format
 */
export const timeStampFormat = (time, format) => {
  if (!time) {
    return '';
  }
  const t = new Date(+time);
  const tf = (i) => (i < 10 ? '0' : '') + i;
  return format.replace(/yyyy|MM|dd|HH|mm|ss/g, (a) => {
    switch (a) {
      case 'yyyy':
        return tf(t.getFullYear());
      case 'MM':
        return tf(t.getMonth() + 1);
      case 'mm':
        return tf(t.getMinutes());
      case 'dd':
        return tf(t.getDate());
      case 'HH':
        return tf(t.getHours());
      case 'ss':
        return tf(t.getSeconds());
      default:
        return time + '';
    }
  });
};

let zIndex = 0;

export const getIndex = (index) => {
  if (index !== void 0) {
    zIndex = index;
  }
  return ++zIndex;
};

export const pagination = (totalNum = 5, needEllipsis = true) => (
  total,
  current = total,
) => {
  if (total === 0) {
    return [];
  }
  if (current > total) {
    current = total;
  }else if (current < 1) {
    current = 1;
  }
  const res = [current];
  totalNum--;
  let step = 0,
    prev = false,
    next = false;
  let i = current;
  let j = current;
  while (step < totalNum) {
    if (step < totalNum && j++ < total) {
      step++;
      res.push(j);
    } else {
      next = true;
    }
    if (step < totalNum && i-- > 1) {
      step++;
      res.unshift(i);
    } else {
      prev = true;
    }
    if (prev && next) {
      break;
    }
  }
  if (needEllipsis) {
    if (res[0] !== 1) {
      if (res[0] - 1 > 1) {
        res.unshift('<<');
      }
      res.unshift(1);
    }
    if (res[res.length - 1] !== total) {
      if (total - res[res.length - 1] > 1) {
        res.push('>>');
      }
      res.push(total);
    }
  }
  return res;
};

export const genColor = () => {
  return `rgba(${Math.floor(Math.random()*200)},${Math.floor(Math.random()*200)},${Math.floor(Math.random()*200)},0.2)`;
};

export const getSafeHtml = (html = '', maxLength = 200) => {
  return html.replace(/<\/?[^>]+>/g, ' ')
    .slice(0, maxLength)
};

// 将匹配项依此替换为对应数组内容
export const replaceMatchedRegexpWithArr = (str = '', regexp, arr, originRemain = false) => {
  let i = 0;
  return str.replace(regexp, (text) => {
    const result = decodeURIComponent(arr[i++]);
    return result || (originRemain ? text : '');
  });
}

/**
 * 返回一个等待ms后resolved的Promise
 * @param ms
 * @returns {Promise<unknown>}
 */
export function timeoutPromise(ms) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`_timeout_${ms}`);
    }, ms)
  })
}

/**
 *
 * @param ms
 * @param timeoutCallback
 * @returns {function(*, ...[*]): Promise<Awaited<unknown>>}
 */
export const timeoutCallCreator = (ms, timeoutCallback = () => {}) => (callFn, ...rest) => {
  return Promise.race([timeoutPromise(ms), callFn(...rest)]).then(res => {
    if (/^_timeout_/.test(res)) {
      console.log(`after ${ms}ms still pending`, ...rest);
      // 返回一直一直pending的新Promise
      timeoutCallback(res);
      return new Promise(() => {});
    }
    return res;
  })
}

export function timeoutCallWithLaTrack(ms, trackName, trackType) {
  return timeoutCallCreator(ms, (result) => {
    if (window.LA) {
      window.LA.track(trackName, {
        type: trackType,
        result,
      });
    }
  });
}

export function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
