export const specialtyGroups = [
  {
    label: "Dental",
    options: [
      "General Dentist",
      "Orthodontist",
      "Implantologist",
      "Prosthodontist",
      "Endodontist",
      "Periodontist",
      "Oral & Maxillofacial Surgeon",
      "OMF Radiologist",
      "Pediatric Dentist",
      "Cosmetic Dentist",
    ],
  },
  {
    label: "Medical",
    options: [
      "General Practitioner",
      "Radiologist",
      "Dermatologist",
      "ENT Specialist",
      "Orthopedic Surgeon",
      "Other",
    ],
  },
];

export const allSpecialties = specialtyGroups.flatMap((g) => g.options);
