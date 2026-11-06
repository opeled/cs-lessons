/* Lesson: רקורסיה על מערך – הערך השכיח (Sod / What)
   Simulations that record a run for the shared trace engine (lib/trace.js). */

const ARR_DEFAULT=[3,1,3,2,1,3];
const ARR_TIE=[4,7,4,2,7,9,7,4];

const CODE_SOD=`public static int Sod(int[] arr, int i, int x)
{
    if (i == arr.Length)
        return 0;
    if (arr[i] == x)
        return 1 + Sod(arr, i + 1, x);
    return Sod(arr, i + 1, x);
}`;
const CODE_WHAT=`public static int What(int[] arr, int i)
{
    if (i == arr.Length - 1)
        return arr[i];
    int best = What(arr, i + 1);
    if (Sod(arr, 0, arr[i]) > Sod(arr, 0, best))
        return arr[i];
    return best;
}`;

/* plain computations (known values + checking examples) */
function sodValue(vals,i,x){let c=0;for(let k=i;k<vals.length;k++)if(vals[k]===x)c++;return c;}
function whatValue(vals,i=0){if(i===vals.length-1)return vals[i];const best=whatValue(vals,i+1);return sodValue(vals,0,vals[i])>sodValue(vals,0,best)?vals[i]:best;}
/* how many times Sod is entered during What(arr, 0) */
function sodEntries(vals){let c=0;for(let i=0;i<vals.length-1;i++)c+=2*(vals.length+1);return c;}

/* --- Sod(arr, i, x): full trace --- */
function simSod(vals,R,x,parent=null,parentLi=null,i=0){
  const end=i===vals.length;
  const id=R.call(`Sod(i = ${i}, x = ${x})`,parent,parentLi,{focus:end?undefined:i},
    parent===null?`קוראים ל־Sod עם המערך, i = 0 ו־x = ${x}.`:end?`קריאה רקורסיבית: Sod עם i = ${i}, מעבר לתא האחרון.`:`קריאה רקורסיבית: Sod עם i = ${i}. הקריאה הקודמת מחכה לתשובה.`);
  R.line(id,'if (i == arr.Length)',{kind:'if',res:end,eval:`${i} == ${vals.length}`,focus:end?undefined:i,
    text:end?`i הגיע לאורך המערך: עברנו על כל התאים. תנאי עצירה.`:`i = ${i} קטן מאורך המערך (${vals.length}), ממשיכים.`});
  if(end){R.ret(id,'return 0',0,{},`Sod(i = ${i}) מחזירה 0: אין עוד תאים לספור.`);return 0;}
  const hit=vals[i]===x;
  R.line(id,'if (arr[i] == x)',{kind:'if',res:hit,eval:`${vals[i]} == ${x}`,focus:i,
    text:hit?`בתא ${i} נמצא ${vals[i]}, שווה ל־x. נספור אותו: 1 ועוד מה שיחזור משאר המערך.`:`בתא ${i} נמצא ${vals[i]}, שונה מ־x = ${x}. לא סופרים, רק ממשיכים לתא הבא.`});
  const li=R.line(id,hit?'return 1 + Sod(arr, i + 1, x)':'return Sod(arr, i + 1, x)',{kind:'sub',focus:i,focus2:i+1<vals.length?i+1:undefined,
    text:`קוראים ל־Sod על שאר המערך, מתא ${i+1}.`});
  const rest=simSod(vals,R,x,id,li,i+1);
  const v=hit?rest+1:rest;
  R.ret(id,hit?`return 1 + ${rest}`:`return ${rest}`,v,{focus:i,range:[i,vals.length-1]},
    hit?`חזרנו ל־Sod(i = ${i}) עם ${rest}. מחזירים 1 + ${rest} = ${v}.`:`חזרנו ל־Sod(i = ${i}) עם ${rest}. התא לא נספר, מחזירים ${v} כפי שהוא.`);
  return v;
}

/* --- What(arr, i): Sod is a known value --- */
function simWhat(vals,R,parent=null,parentLi=null,i=0){
  const last=i===vals.length-1,v=vals[i];
  const id=R.call(`What(i = ${i})`,parent,parentLi,{focus:i},
    parent===null?`קוראים ל־What עם המערך ו־i = 0.`:`קריאה רקורסיבית: What עם i = ${i}. הקריאה הקודמת מחכה.`);
  R.line(id,'if (i == arr.Length - 1)',{kind:'if',res:last,eval:`${i} == ${vals.length-1}`,focus:i,
    text:last?`i = ${i} הוא התא האחרון: תנאי עצירה. המועמד היחיד הוא הערך שבתא, ${v}.`:`i = ${i} אינו התא האחרון, ממשיכים.`});
  if(last){R.ret(id,`return arr[${i}]`,v,{focus:i},`What(i = ${i}) מחזירה ${v}.`);return v;}
  const li=R.line(id,'int best = What(arr, i + 1)',{kind:'sub',focus:i,focus2:i+1,
    text:`לפני כל השוואה: קוראים ל־What על שאר המערך, מתא ${i+1}. ההכרעות מתקבלות מהסוף להתחלה.`});
  const best=simWhat(vals,R,id,li,i+1);
  const c1=sodValue(vals,0,v),c2=sodValue(vals,0,best);
  R.line(id,`Sod(arr, 0, arr[${i}])`,{kind:'inner',val:c1,focus:i,
    text:`חזרנו ל־What(i = ${i}) עם best = ${best}. אין צורך לעקוב אחרי Sod: מסעיף א׳ אנחנו יודעים שהיא סופרת מופעים. הערך ${v} מופיע במערך ${c1} פעמים.`});
  R.line(id,`Sod(arr, 0, best)`,{kind:'inner',val:c2,focus:i,
    text:`וגם best = ${best} נספר: הוא מופיע במערך ${c2} פעמים.`});
  const res=c1>c2;
  R.line(id,'if (c1 > c2)',{kind:'if',res,eval:`${c1} > ${c2}`,focus:i,
    text:res?`האם ${c1} > ${c2}? כן. הערך ${v} שכיח יותר מ־best, ולכן הוא מחליף אותו.`
            :c1===c2?`האם ${c1} > ${c2}? לא: תיקו. בגלל ״>״ ולא ״>=״, best = ${best} נשאר.`
                    :`האם ${c1} > ${c2}? לא. best = ${best} שכיח יותר, ונשאר.`});
  const out=res?v:best;
  R.ret(id,res?`return arr[${i}]`:'return best',out,{focus:i},`What(i = ${i}) מחזירה ${out}.`);
  return out;
}
