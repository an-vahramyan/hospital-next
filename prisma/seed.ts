// ============================================================
// test data |   for run: npm run seed
// ============================================================
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const daysFromNow = (d: number, h = 10, m = 0) => {
  const x = new Date();
  x.setDate(x.getDate() + d);
  x.setHours(h, m, 0, 0);
  return x;
};

async function main() {
  // 1.children first then parents
  await prisma.notification.deleteMany();
  await prisma.pharmacyRequest.deleteMany();
  await prisma.queueTicket.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.examination.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.service.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.department.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.article.deleteMany();
  await prisma.user.deleteMany();

  const hash = (p: string) => bcrypt.hash(p, 10);

  // 2. admin
  await prisma.user.create({
    data: { email: "admin@hospital.am", passwordHash: await hash("Admin123!"), role: "ADMIN", firstName: "Ադմին", lastName: "Համակարգ" },
  });

  // 3. 
  const deps = await Promise.all(
    [
      { slug: "cardiology", name: "Սրտաբանություն", description: "Սրտի և անոթների հիվանդություններ, ճնշում, առիթմիա" },
      { slug: "neurology", name: "Նյարդաբանություն", description: "Գլխացավ, գլխապտույտ, նյարդային համակարգի խնդիրներ" },
      { slug: "pediatrics", name: "Մանկաբուժություն", description: "Երեխաների առողջություն՝ ծնունդից մինչև 18 տարեկան" },
      { slug: "therapy", name: "Թերապիա", description: "Ընդհանուր բժշկական զննում, մրսածություն, ջերմություն" },
      { slug: "radiology", name: "Ռադիոլոգիա", description: "ՄՌՏ, ԿՏ, ռենտգեն, ուլտրաձայնային հետազոտություն" },
    ].map((data) => prisma.department.create({ data })),
  );
  const dep = Object.fromEntries(deps.map((d) => [d.slug, d]));

  // 4. doctors
  const doctorsData = [
    { email: "doctor@hospital.am", firstName: "Անի", lastName: "Սարգսյան", dep: "cardiology", specialty: "Սրտաբան", exp: 15, bio: "Երևանի պետական բժշկական համալսարանի շրջանավարտ։ Մասնագիտացել է Բեռլինի Charité կլինիկայում։ Զբաղվում է սրտային անբավարարության և առիթմիաների բուժմամբ։" },
    { email: "aram.petrosyan@hospital.am", firstName: "Արամ", lastName: "Պետրոսյան", dep: "cardiology", specialty: "Ինտերվենցիոն սրտաբան", exp: 11, bio: "Կորոնարոգրաֆիա և ստենտավորում։ 2000+ հաջող միջամտություն։" },
    { email: "lilit.hakobyan@hospital.am", firstName: "Լիլիթ", lastName: "Հակոբյան", dep: "neurology", specialty: "Նյարդաբան", exp: 12, bio: "Միգրենի, էպիլեպսիայի և քնի խանգարումների մասնագետ։" },
    { email: "davit.grigoryan@hospital.am", firstName: "Դավիթ", lastName: "Գրիգորյան", dep: "neurology", specialty: "Նյարդավիրաբույժ", exp: 18, bio: "Ողնաշարի և գլխուղեղի վիրահատություններ։" },
    { email: "mariam.avetisyan@hospital.am", firstName: "Մարիամ", lastName: "Ավետիսյան", dep: "pediatrics", specialty: "Մանկաբույժ", exp: 9, bio: "Նորածինների և վաղ տարիքի երեխաների խնամք, պատվաստումներ։" },
    { email: "gor.harutyunyan@hospital.am", firstName: "Գոռ", lastName: "Հարությունյան", dep: "therapy", specialty: "Թերապևտ", exp: 7, bio: "Ընդհանուր պրակտիկայի բժիշկ, կանխարգելիչ զննումներ։", start: "10:00", end: "18:00" },
    { email: "nare.mkrtchyan@hospital.am", firstName: "Նարե", lastName: "Մկրտչյան", dep: "radiology", specialty: "Ռադիոլոգ", exp: 10, bio: "ՄՌՏ և ԿՏ պատկերների մեկնաբանում, ուլտրաձայնային ախտորոշում։", slot: 20 },
  ];
  const DOCTOR_PHOTOS: Record<string, string> = {
    "doctor@hospital.am": "/images/doctors/ani-sargsyan.jpg",
    "aram.petrosyan@hospital.am": "/images/doctors/aram-petrosyan.jpg",
    "lilit.hakobyan@hospital.am": "/images/doctors/lilit-hakobyan.jpg",
    "davit.grigoryan@hospital.am": "/images/doctors/davit-grigoryan.jpg",
    "mariam.avetisyan@hospital.am": "/images/doctors/mariam-avetisyan.jpg",
    "gor.harutyunyan@hospital.am": "/images/doctors/gor-harutyunyan.jpg",
    "nare.mkrtchyan@hospital.am": "/images/doctors/nare-mkrtchyan.jpg",
  };
  const doctors = [];
  for (const d of doctorsData) {
    const u = await prisma.user.create({
      data: {
        email: d.email,
        passwordHash: await hash("Doctor123!"),
        role: "DOCTOR",
        firstName: d.firstName,
        lastName: d.lastName,
        phone: "+374 10 000000",
        doctor: {
          create: {
            departmentId: dep[d.dep].id,
            specialty: d.specialty,
            bio: d.bio,
            photoUrl: DOCTOR_PHOTOS[d.email] ?? null,
            experienceYears: d.exp,
            workStart: d.start ?? "09:00",
            workEnd: d.end ?? "17:00",
            slotMinutes: d.slot ?? 30,
          },
        },
      },
      include: { doctor: true },
    });
    doctors.push(u.doctor!);
  }
  const [ani, , lilit] = doctors;

  // 5.services
  const services = [
    ["cardiology", "Սրտաբանի խորհրդատվություն", "Առաջնային զննում, անամնեզ, խորհուրդներ", 12000, 30],
    ["cardiology", "ԷՍԳ (էլեկտրասրտագրություն)", "Սրտի ռիթմի և աշխատանքի գրանցում", 5000, 15],
    ["cardiology", "Սրտի ԷԽՈ", "Սրտի ուլտրաձայնային հետազոտություն", 18000, 30],
    ["neurology", "Նյարդաբանի խորհրդատվություն", "Նյարդաբանական զննում", 12000, 30],
    ["neurology", "ԷԷԳ", "Գլխուղեղի էլեկտրական ակտիվության գրանցում", 15000, 40],
    ["pediatrics", "Մանկաբույժի զննում", "Երեխայի ընդհանուր զննում", 8000, 30],
    ["pediatrics", "Պատվաստում", "Ըստ ազգային օրացույցի", 3000, 15],
    ["therapy", "Թերապևտի խորհրդատվություն", "Ընդհանուր զննում և ուղեգրում", 7000, 30],
    ["therapy", "Արյան ընդհանուր անալիզ", "Լաբորատոր հետազոտություն", 3500, 10],
    ["radiology", "ՄՌՏ (մագնիսառեզոնանսային տոմոգրաֆիա)", "Մեկ հատված, 3 Տեսլա", 45000, 40],
    ["radiology", "ԿՏ (համակարգչային տոմոգրաֆիա)", "Մեկ հատված", 35000, 20],
    ["radiology", "Ուլտրաձայնային հետազոտություն", "Որովայնի խոռոչ", 10000, 20],
  ] as const;
  const createdServices = [];
  for (const [d, name, description, price, durationMin] of services) {
    createdServices.push(
      await prisma.service.create({ data: { departmentId: dep[d].id, name, description, price, durationMin } }),
    );
  }

  // 6. tools
  const EQUIP_IMAGES: Record<string, string> = {
    "Siemens MAGNETOM Vida 3T ՄՌՏ": "/images/equipment/mri.jpg",
    "GE Revolution CT": "/images/equipment/ct.jpg",
    "Philips EPIQ Elite": "/images/equipment/ultrasound.jpg",
    "Digital X-ray Carestream DRX": "/images/equipment/xray.jpg",
    "Holter ECG Schiller": "/images/equipment/ecg.jpg",
    "Հին ռենտգեն սարք": "/images/equipment/old-xray.jpg",
  };
  await prisma.equipment.createMany({
    data: [
      { name: "Siemens MAGNETOM Vida 3T ՄՌՏ", description: "Բարձր լուծաչափով մագնիսառեզոնանսային տոմոգրաֆ՝ արագ և հարմարավետ հետազոտության համար", isNew: true, acquiredAt: daysFromNow(-40) },
      { name: "GE Revolution CT", description: "256 շերտանի համակարգչային տոմոգրաֆ՝ ճառագայթման նվազեցված դոզայով", isNew: true, acquiredAt: daysFromNow(-90) },
      { name: "Philips EPIQ Elite", description: "Պրեմիում դասի ուլտրաձայնային սարք սրտի և անոթների հետազոտության համար", isNew: true, acquiredAt: daysFromNow(-120) },
      { name: "Digital X-ray Carestream DRX", description: "Թվային ռենտգեն ակնթարթային պատկերով", isNew: false, acquiredAt: daysFromNow(-800) },
      { name: "Holter ECG Schiller", description: "24-ժամյա ԷՍԳ մոնիտորինգ", isNew: false, acquiredAt: daysFromNow(-600) },
      { name: "Հին ռենտգեն սարք", description: "Դուրս է գրված", isNew: false, status: "RETIRED", acquiredAt: daysFromNow(-4000) },
    ].map((e) => ({ ...e, imageUrl: EQUIP_IMAGES[e.name] ?? null })),
  });

  // 7.test pacient + history
  const patientUser = await prisma.user.create({
    data: {
      email: "patient@hospital.am",
      passwordHash: await hash("Patient123!"),
      role: "PATIENT",
      firstName: "Կարեն",
      lastName: "Վարդանյան",
      phone: "+374 91 123456",
      patient: { create: { birthDate: new Date("1990-05-14"), gender: "MALE", bloodType: "A+", allergies: "Պենիցիլին" } },
    },
    include: { patient: true },
  });
  const patient = patientUser.patient!;

  await prisma.visit.create({
    data: { patientId: patient.id, doctorId: ani.id, date: daysFromNow(-14, 11), diagnosis: "Զարկերակային հիպերտենզիա, I աստիճան", notes: "Վերահսկել ճնշումը օրական 2 անգամ, կրկնակի այց 1 ամսից" },
  });
  await prisma.appointment.create({
    data: { patientId: patient.id, doctorId: ani.id, serviceId: createdServices[0].id, startsAt: daysFromNow(-14, 11), endsAt: daysFromNow(-14, 11, 30), status: "COMPLETED" },
  });
  
  await prisma.appointment.create({
    data: { patientId: patient.id, doctorId: ani.id, serviceId: createdServices[1].id, startsAt: daysFromNow(1, 10), endsAt: daysFromNow(1, 10, 30), notes: "Կրկնակի այց" },
  });
  await prisma.appointment.create({
    data: { patientId: patient.id, doctorId: lilit.id, startsAt: daysFromNow(3, 14), endsAt: daysFromNow(3, 14, 30) },
  });

  const year = new Date().getFullYear();
  await prisma.prescription.create({
    data: {
      code: `RX-${year}-0001`,
      patientId: patient.id,
      doctorId: ani.id,
      issuedAt: daysFromNow(-14, 11),
      validUntil: daysFromNow(16, 23),
      items: {
        create: [
          { medicineName: "Amoxicillin", genericName: "amoxicillin", dosage: "500mg", frequency: "3 անգամ օրական", durationDays: 7, quantity: 20 },
          { medicineName: "Paracetamol", genericName: "paracetamol", dosage: "500mg", frequency: "ըստ անհրաժեշտության", durationDays: 5, quantity: 10 },
        ],
      },
    },
  });
  await prisma.prescription.create({
    data: {
      code: `RX-${year}-0002`,
      patientId: patient.id,
      doctorId: ani.id,
      issuedAt: daysFromNow(-60, 11),
      validUntil: daysFromNow(-30, 23),
      items: { create: [{ medicineName: "Lisinopril", genericName: "lisinopril", dosage: "10mg", frequency: "1 անգամ օրական", durationDays: 30, quantity: 30 }] },
    },
  });

  await prisma.examination.createMany({
    data: [
      { patientId: patient.id, type: "Արյան ընդհանուր անալիզ", status: "DONE", orderedAt: daysFromNow(-14, 11), resultAt: daysFromNow(-13, 15), result: "Հեմոգլոբին՝ 145 գ/լ, լեյկոցիտներ՝ 6.2×10⁹/լ, ԷՆԱ՝ 8 մմ/ժ — նորմայի սահմաններում" },
      { patientId: patient.id, type: "Սրտի ԷԽՈ", status: "ORDERED", orderedAt: daysFromNow(-1, 12) },
    ],
  });

  await prisma.notification.create({
    data: { type: "INFO", message: "Բարի գալուստ! Դեղատան ծանուցումները կհայտնվեն այստեղ։", patientId: patient.id, prescriptionCode: `RX-${year}-0001` },
  });

  //for demo - nearest appointment
  const pad = (n: number) => String(n).padStart(2, "0");
  const t = new Date();
  const today = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
  await prisma.queueTicket.createMany({
    data: [
      { departmentId: dep.therapy.id, date: today, number: 1, status: "DONE" },
      { departmentId: dep.therapy.id, date: today, number: 2, status: "CALLED", calledAt: new Date() },
      { departmentId: dep.therapy.id, date: today, number: 3 },
      { departmentId: dep.therapy.id, date: today, number: 4 },
    ],
  });

  // 8. articles (hy, en, ru)
  const ARTICLE_COVERS: Record<string, string> = {
    "arterial-pressure-hy": "/images/articles/blood-pressure.jpg",
    "blood-pressure-en": "/images/articles/blood-pressure.jpg",
    "davlenie-ru": "/images/articles/blood-pressure.jpg",
    "child-fever-hy": "/images/articles/child-fever.jpg",
    "temperatura-u-rebenka-ru": "/images/articles/child-fever.jpg",
    "mri-what-to-know-hy": "/images/articles/mri.jpg",
    "mri-guide-en": "/images/articles/mri.jpg",
  };
  await prisma.article.createMany({
    data: [
      {
        slug: "arterial-pressure-hy", language: "hy", isPublished: true, publishedAt: daysFromNow(-3),
        title: "Ինչպես վերահսկել զարկերակային ճնշումը տանը",
        content: "Բարձր ճնշումը հաճախ ախտանիշներ չի տալիս, դրա համար այն անվանում են «լուռ մարդասպան»։\n\nՉափեք ճնշումը առավոտյան և երեկոյան, հանգիստ վիճակում, նստած։ Ձեռքը պետք է լինի սրտի մակարդակին։\n\nՆորմալ է համարվում 120/80 մմ ս.ս.-ից ցածր ցուցանիշը։ Եթե ցուցանիշները պարբերաբար 140/90-ից բարձր են, դիմեք սրտաբանին։\n\nՕգտակար սովորություններ՝ քիչ աղ, ամենօրյա քայլք 30 րոպե, ծխելուց հրաժարում, բավարար քուն։",
      },
      {
        slug: "child-fever-hy", language: "hy", isPublished: true, publishedAt: daysFromNow(-10),
        title: "Երեխայի ջերմություն․ երբ դիմել բժշկի",
        content: "Ջերմությունը օրգանիզմի պաշտպանական ռեակցիա է։\n\nԱնհապաղ դիմեք բժշկի, եթե՝ երեխան 3 ամսականից փոքր է և ջերմությունը 38°C-ից բարձր է, ջերմությունը պահպանվում է 3 օրից ավել, առկա են ցնցումներ, շնչառության դժվարություն կամ ցան։\n\nՏվեք շատ հեղուկ և մի փաթաթեք երեխային։",
      },
      {
        slug: "mri-what-to-know-hy", language: "hy", isPublished: true, publishedAt: daysFromNow(-20),
        title: "ՄՌՏ հետազոտություն․ ինչ պետք է իմանալ",
        content: "ՄՌՏ-ն անվտանգ է և չի օգտագործում ռենտգենյան ճառագայթում։\n\nՀետազոտությունից առաջ հանեք մետաղական առարկաները և տեղեկացրեք բժշկին կարդիոստիմուլյատորի կամ իմպլանտների մասին։\n\nՄեր նոր 3 Տեսլա սարքը թույլ է տալիս հետազոտությունն անցկացնել ավելի արագ և հարմարավետ։",
      },
      {
        slug: "blood-pressure-en", language: "en", isPublished: true, publishedAt: daysFromNow(-3),
        title: "How to monitor your blood pressure at home",
        content: "High blood pressure often has no symptoms, which is why it is called the \"silent killer\".\n\nMeasure your pressure in the morning and in the evening, seated and relaxed, with your arm at heart level.\n\nBelow 120/80 mmHg is considered normal. If your readings are regularly above 140/90, see a cardiologist.\n\nHealthy habits: less salt, a 30-minute daily walk, no smoking and enough sleep.",
      },
      {
        slug: "mri-guide-en", language: "en", isPublished: true, publishedAt: daysFromNow(-20),
        title: "MRI scan: what you should know",
        content: "MRI is safe and does not use X-ray radiation.\n\nRemove all metal objects before the scan and tell the doctor about a pacemaker or implants.\n\nOur new 3 Tesla scanner makes the exam faster and more comfortable.",
      },
      {
        slug: "davlenie-ru", language: "ru", isPublished: true, publishedAt: daysFromNow(-3),
        title: "Как контролировать артериальное давление дома",
        content: "Повышенное давление часто протекает без симптомов — поэтому его называют «тихим убийцей».\n\nИзмеряйте давление утром и вечером, сидя, в спокойном состоянии; рука должна быть на уровне сердца.\n\nНормой считается показатель ниже 120/80 мм рт. ст. Если значения регулярно выше 140/90, обратитесь к кардиологу.\n\nПолезные привычки: меньше соли, ежедневная прогулка 30 минут, отказ от курения, полноценный сон.",
      },
      {
        slug: "temperatura-u-rebenka-ru", language: "ru", isPublished: true, publishedAt: daysFromNow(-10),
        title: "Температура у ребёнка: когда идти к врачу",
        content: "Температура — защитная реакция организма.\n\nСрочно обратитесь к врачу, если ребёнку меньше 3 месяцев и температура выше 38°C, жар держится больше 3 дней, есть судороги, затруднённое дыхание или сыпь.\n\nДавайте больше жидкости и не кутайте ребёнка.",
      },
      {
        slug: "draft-article", language: "hy", isPublished: false,
        title: "Սևագիր հոդված", content: "Այս հոդվածը դեռ հրապարակված չէ։",
      },
    ].map((a) => ({ ...a, coverUrl: ARTICLE_COVERS[a.slug] ?? null })),
  });

  console.log("✅ Seed completed");
  console.log("   admin@hospital.am   / Admin123!");
  console.log("   doctor@hospital.am  / Doctor123!   (все врачи: Doctor123!)");
  console.log("   patient@hospital.am / Patient123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
