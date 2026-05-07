const quotes = [
  { id: 1, content: '学而不思则罔，思而不学则殆。', author: '孔子', source: '《论语》' },
  { id: 2, content: '路漫漫其修远兮，吾将上下而求索。', author: '屈原', source: '《离骚》' },
  { id: 3, content: '书山有路勤为径，学海无涯苦作舟。', author: '韩愈' },
  { id: 4, content: '千里之行，始于足下。', author: '老子', source: '《道德经》' },
  { id: 5, content: '天行健，君子以自强不息。', author: '周文王', source: '《周易》' },
  { id: 6, content: '不积跬步，无以至千里；不积小流，无以成江海。', author: '荀子', source: '《劝学》' },
  { id: 7, content: '业精于勤，荒于嬉；行成于思，毁于随。', author: '韩愈', source: '《进学解》' },
  { id: 8, content: '黑发不知勤学早，白首方悔读书迟。', author: '颜真卿' },
  { id: 9, content: '读书破万卷，下笔如有神。', author: '杜甫' },
  { id: 10, content: '纸上得来终觉浅，绝知此事要躬行。', author: '陆游', source: '《冬夜读书示子聿》' },
  { id: 11, content: '博学之，审问之，慎思之，明辨之，笃行之。', author: '子思', source: '《中庸》' },
  { id: 12, content: '知之者不如好之者，好之者不如乐之者。', author: '孔子', source: '《论语》' },
  { id: 13, content: '三更灯火五更鸡，正是男儿读书时。', author: '颜真卿' },
  { id: 14, content: '宝剑锋从磨砺出，梅花香自苦寒来。', author: '古训' },
  { id: 15, content: '少年辛苦终身事，莫向光阴惰寸功。', author: '杜荀鹤' },
  { id: 16, content: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { id: 17, content: 'Education is the most powerful weapon which you can use to change the world.', author: 'Nelson Mandela' },
  { id: 18, content: 'Live as if you were to die tomorrow. Learn as if you were to live forever.', author: 'Mahatma Gandhi' },
  { id: 19, content: 'The beautiful thing about learning is that nobody can take it away from you.', author: 'B.B. King' },
  { id: 20, content: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
  { id: 21, content: 'The expert in anything was once a beginner.', author: 'Helen Hayes' },
  { id: 22, content: 'Study hard what interests you the most in the most undisciplined, irreverent and original manner possible.', author: 'Richard Feynman' },
  { id: 23, content: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
  { id: 24, content: 'An investment in knowledge pays the best interest.', author: 'Benjamin Franklin' },
  { id: 25, content: 'The roots of education are bitter, but the fruit is sweet.', author: 'Aristotle' },
  { id: 26, content: '己所不欲，勿施于人。', author: '孔子', source: '《论语》' },
  { id: 27, content: '温故而知新，可以为师矣。', author: '孔子', source: '《论语》' },
  { id: 28, content: '三人行，必有我师焉。', author: '孔子', source: '《论语》' },
  { id: 29, content: '人的一生应当这样度过：当他回首往事时，不因虚度年华而悔恨。', author: '奥斯特洛夫斯基', source: '《钢铁是怎样炼成的》' },
  { id: 30, content: '有志者事竟成。', author: '范晔', source: '《后汉书》' },
];

export function getDailyQuote(): typeof quotes[0] {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return quotes[dayOfYear % quotes.length];
}

export function getRandomQuote(): typeof quotes[0] {
  return quotes[Math.floor(Math.random() * quotes.length)];
}

export function getAllQuotes() {
  return quotes;
}

export default quotes;
