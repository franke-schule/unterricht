Robot dudu = new Robot(1, 1, 12, 12);

for (int reihe = 0; reihe < 5; reihe++) {
   dudu.linksDrehen();
   dudu.schritt();
   dudu.rechtsDrehen();

   for (int feld = 0; feld < 3; feld++) {
      dudu.schritt();
      dudu.rechtsDrehen();
      dudu.hinlegen(4);
      dudu.linksDrehen();
   }

   dudu.rechtsDrehen();
   dudu.rechtsDrehen();
   for (int rueckweg = 0; rueckweg < 3; rueckweg++) {
      dudu.schritt();
   }
   dudu.rechtsDrehen();
   dudu.rechtsDrehen();
}
