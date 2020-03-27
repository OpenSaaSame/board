// Return the total number of checkboxes and the number of checked checkboxes inside a given text
export const findCheckboxes = text => {
  const checkboxes = text.match(/\[(\s|x)\]/g) || [];
  const checked = checkboxes.filter(checkbox => checkbox === "[x]").length;
  return { total: checkboxes.length, checked };
};

export const mapBy = field => list => {
  const ret = {};
  list.forEach(item => ret[item[field]] = item);
  return ret;
}

Object.fromEntries = l => l.reduce((a, [k,v]) => ({...a, [k]: v}), {});

export const filterObject = (obj, pred) =>
  Object.fromEntries(Object.entries(obj).filter(item => pred(item[1])));