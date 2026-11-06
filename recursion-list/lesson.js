/* Lesson: רקורסיה על שרשרת חוליות – הרצף העולה (What / Secret)
   Simulations that record a run for the shared trace engine (lib/trace.js). */

const LIST_DEFAULT=[3,5,2,4,6,1];

const CODE_WHAT=`public static int What(Node<int> lst)
{
    if (lst.GetNext() == null)
        return 1;
    int len = What(lst.GetNext());
    if (lst.GetValue() < lst.GetNext().GetValue())
        return len + 1;
    return 1;
}`;
const CODE_SECRET=`public static int Secret(Node<int> lst)
{
    if (lst == null)
        return 0;
    return Math.Max(What(lst), Secret(lst.GetNext()));
}`;

/* plain computations (used for "known values" and for checking examples) */
function whatValue(vals,i){let len=1;for(let k=i;k+1<vals.length&&vals[k]<vals[k+1];k++)len++;return len;}
function secretValue(vals){let best=0;for(let i=0;i<vals.length;i++)best=Math.max(best,whatValue(vals,i));return best;}

/* --- What(lst): full trace --- */
function simWhat(vals,R,parent=null,parentLi=null,i=0){
  const v=vals[i],last=i===vals.length-1;
  const id=R.call(`What(lst → ${v})`,parent,parentLi,{focus:i},
    parent===null?`קוראים ל־What עם השרשרת. lst מצביעה על החוליה הראשונה, שערכה ${v}.`
                 :`קריאה רקורסיבית: What על השרשרת שמתחילה בחוליה ${v}. הקריאה הקודמת מחכה לתשובה.`);
  R.line(id,'if (lst.GetNext() == null)',{kind:'if',res:last,focus:i,
    text:last?`לחוליה ${v} אין חוליה אחריה: תנאי עצירה. רצף שמתחיל בחוליה האחרונה הוא באורך 1.`
             :`לחוליה ${v} יש חוליה אחריה (${vals[i+1]}). התנאי לא מתקיים, ממשיכים.`});
  if(last){R.ret(id,'return 1',1,{focus:i},`What(${v}) מחזירה 1.`);return 1;}
  const li=R.line(id,'int len = What(lst.GetNext())',{kind:'sub',focus:i,focus2:i+1,
    text:`לפני כל השוואה: קוראים ל־What על שאר השרשרת. שימו לב, הקריאה יוצאת תמיד, בלי קשר לערכים.`});
  const len=simWhat(vals,R,id,li,i+1);
  const res=v<vals[i+1];
  R.line(id,'if (lst.GetValue() < lst.GetNext().GetValue())',{kind:'if',res,eval:`${v} < ${vals[i+1]}`,focus:i,focus2:i+1,
    text:res?`חזרנו ל־What(${v}) עם len = ${len}. האם ${v} < ${vals[i+1]}? כן. החוליה ${v} מצטרפת לרצף שאחריה.`
            :`חזרנו ל־What(${v}) עם len = ${len}. האם ${v} < ${vals[i+1]}? לא. הרצף נשבר כאן, והערך len = ${len} שחושב לא ישמש.`});
  if(res){R.ret(id,'return len + 1',len+1,{focus:i,range:[i,i+len]},`What(${v}) מחזירה ${len} + 1 = ${len+1}.`);return len+1;}
  R.ret(id,'return 1',1,{focus:i},`What(${v}) מחזירה 1: הרצף העולה שמתחיל ב־${v} הוא רק החוליה עצמה.`);return 1;
}

/* --- Secret(lst): What is a known value --- */
function simSecret(vals,R,parent=null,parentLi=null,i=0){
  const isNull=i===vals.length;
  const id=R.call(isNull?'Secret(null)':`Secret(lst → ${vals[i]})`,parent,parentLi,{focus:isNull?undefined:i},
    parent===null?`קוראים ל־Secret עם השרשרת כולה.`:isNull?`קריאה רקורסיבית: Secret על null (אחרי החוליה האחרונה).`:`קריאה רקורסיבית: Secret על השרשרת שמתחילה בחוליה ${vals[i]}.`);
  R.line(id,'if (lst == null)',{kind:'if',res:isNull,focus:isNull?undefined:i,
    text:isNull?`השרשרת ריקה: תנאי עצירה.`:`lst אינה null, ממשיכים.`});
  if(isNull){R.ret(id,'return 0',0,{},`Secret(null) מחזירה 0.`);return 0;}
  const w=whatValue(vals,i);
  R.line(id,'What(lst)',{kind:'inner',val:w,focus:i,range:[i,i+w-1],
    text:`אין צורך לעקוב אחרי What. מסעיף א׳ אנחנו יודעים מה היא מחזירה: אורך הרצף העולה שמתחיל בחוליה ${vals[i]}, כלומר ${w}.`});
  const li=R.line(id,'Secret(lst.GetNext())',{kind:'sub',focus:i,text:`עכשיו קוראים ל־Secret על שאר השרשרת.`});
  const s=simSecret(vals,R,id,li,i+1);
  const m=Math.max(w,s);
  R.ret(id,`return Math.Max(${w}, ${s})`,m,{focus:i},
    `חזרנו ל־Secret(${vals[i]}). הגדול מבין ${w} (הרצף שמתחיל כאן) ו־${s} (הטוב ביותר בהמשך) הוא ${m}.`);
  return m;
}

/* describe a list as "3 → 5 → 8" */
function listStr(vals){return vals.join(' → ');}
