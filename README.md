# קרבן יומי

אתר קטן בעברית שמציג את מספר קרבנות הציבור הקבועים שהיו קרבים בכל יום בבית המקדש בירושלים.

## תמונות

שים את התמונות בתיקייה `public/images/` בשמות האלה:

- `bull.png` - פרים
- `young-bull.png` - פרים בני בקר
- `ram.png` - אילים
- `lamb.png` - כבשים
- `goat.png` - שעירים

אם תמונה חסרה, האתר מציג מקום נקי במקומה.

## הרצה

```bash
npm install
npm run dev
```

בדיקות:

```bash
npm test
```

## פריסה

האתר נבנה אוטומטית ל-GitHub Pages בכל push ל-`main` בעזרת GitHub Actions.
ב-repository החדש יש לבחור Settings -> Pages -> Build and deployment -> GitHub Actions.
