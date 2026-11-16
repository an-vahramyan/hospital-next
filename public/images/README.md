# Կայքի նկարներ / Site images

All photos come from **Unsplash** (https://unsplash.com/license — free to use, including commercially, no attribution required).
They were resized with Unsplash's image CDN (`w`, `h`, `fit=crop`, `q=75`), so each file is only 40–130 KB.

| File | Where it is shown | Unsplash photo |
|---|---|---|
| hero-doctors.jpg | Home, hero block (1200×900) | unsplash.com/photos/2kopEHjST-g |
| about-clinic.jpg | Home, "Why choose us" (1000×1100) | unsplash.com/photos/Pk-KuizxQv8 |
| doctors/ani-sargsyan.jpg | Doctor photo (600×600) | unsplash.com/photos/rm7rZYdl3rY |
| doctors/aram-petrosyan.jpg | 〃 | unsplash.com/photos/279xIHymPYY |
| doctors/lilit-hakobyan.jpg | 〃 | unsplash.com/photos/_4xStiTXY1o |
| doctors/davit-grigoryan.jpg | 〃 | unsplash.com/photos/XqMo4OlBnh0 |
| doctors/mariam-avetisyan.jpg | 〃 | unsplash.com/photos/Z7TAIOQgjWA |
| doctors/gor-harutyunyan.jpg | 〃 | unsplash.com/photos/3HIroMoyre8 |
| doctors/nare-mkrtchyan.jpg | 〃 | unsplash.com/photos/H9lg5Noj660 |
| equipment/mri.jpg | Equipment (800×600) | unsplash.com/photos/MhM8LiIzmZw |
| equipment/ct.jpg | 〃 | unsplash.com/photos/8HkEfVdZdbA |
| equipment/ultrasound.jpg | 〃 | unsplash.com/photos/UjaXMJbDNM4 |
| equipment/xray.jpg | 〃 | unsplash.com/photos/tHS9j3HWT1s |
| equipment/old-xray.jpg | 〃 | unsplash.com/photos/QTP8UKW_PgI |
| equipment/ecg.jpg | 〃 | unsplash.com/photos/eqTmD-baDkU |
| articles/blood-pressure.jpg | Article cover (1200×675) | unsplash.com/photos/i1iqQRLULlg |
| articles/child-fever.jpg | 〃 | unsplash.com/photos/U7WKYPKOyHg |
| articles/mri.jpg | 〃 | unsplash.com/photos/AB0r9z7eRYg |

The doctor, equipment and article photos are linked in `prisma/seed.ts` (`photoUrl`, `imageUrl`, `coverUrl`).
New ones can be added from the admin panel by putting a path like `/images/doctors/new.jpg` in those fields.
The people in the photos are stock models, not real staff — replace them with real staff photos for a real clinic.
