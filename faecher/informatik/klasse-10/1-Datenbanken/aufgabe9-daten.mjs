export const JOIN_TASKS = [
  {
    "id": "P1",
    "type": "sql",
    "prompt": "**Liste** die URLs aller Fotos auf, die wanderwut_finn hochgeladen hat. Sortiere sie nach der Foto-ID.",
    "tables": [
      "users",
      "photos"
    ],
    "statement": "SELECT photos.url\nFROM users, photos\nWHERE users.id = photos.user_id\n  AND users.username = 'wanderwut_finn'\nORDER BY photos.id",
    "model": null,
    "hints": [
      "Suche die Tabelle mit den Foto-URLs.",
      "Die hochladende Person steht in photos.user_id.",
      "Verbinde users.id mit photos.user_id und wähle danach den Benutzernamen aus."
    ],
    "feedback": {
      "success": "Korrekt: Du hast die vier URLs der hochgeladenen Fotos gefunden.",
      "partial": "Teilweise korrekt: Prüfe die Verknüpfung und die Reihenfolge nach photos.id.",
      "hint": "Noch nicht korrekt: Die URLs gehören zu den Fotos dieses Mitglieds, nicht zu beliebigen Fotos."
    },
    "required": true
  },
  {
    "id": "P2",
    "type": "describe",
    "maxFeedbackHints": 1,
    "maxPoints": 5,
    "assessmentVersion": "20261029-ordering",
    "prompt": "**Beschreibe** in eigenen Worten, welche Informationen diese Abfrage ausgibt und warum nur bestimmte Fotos erscheinen. **Erkläre** auch die Sortierung.",
    "tables": [
      "users",
      "photos"
    ],
    "statement": "SELECT users.username, photos.description\nFROM users, photos\nWHERE users.id = photos.user_id\n  AND users.city = 'Hamburg'\nORDER BY users.username, photos.id",
    "model": "Die Abfrage zeigt Benutzernamen und Beschreibungen der Fotos, die Mitglieder aus Hamburg hochgeladen haben. Die Mitglieds-ID wird mit der user_id des Fotos verbunden; pro passendem Foto erscheint eine Zeile. Sortiert wird zuerst nach Benutzername von A bis Z, bei gleichem Benutzernamen nach Foto-ID aufsteigend.",
    "hints": [
      "Achte zuerst auf die beiden ausgegebenen Spalten.",
      "Überlege, welche Person photos.user_id bezeichnet.",
      "Die Stadtbedingung bezieht sich auf die hochladende Person; beschrieben werden ihre Fotos. Prüfe außerdem die Angaben hinter ORDER BY und ihre Sortierrichtung."
    ],
    "feedback": {
      "success": "Korrekt: Ausgabe, Verknüpfung und Ortsfilter sind verständlich erklärt.",
      "partial": "Teilweise korrekt: Ergänze, welche Person mit dem Foto verbunden wird oder was die Stadtbedingung bewirkt.",
      "hint": "Noch nicht korrekt: Beschreibe die ausgegebenen Informationen und den Zusammenhang zwischen Mitglied und Foto."
    },
    "required": true
  },
  {
    "id": "P3",
    "type": "sql",
    "prompt": "**Nenne** Name und Benutzername der weiblichen Mitglieder mit mindestens einem Foto, dessen Beschreibung „Sonne“ enthält. Gib jede Person einmal aus und sortiere nach Benutzername.",
    "tables": [
      "users",
      "photos"
    ],
    "statement": "SELECT DISTINCT users.name, users.username\nFROM users, photos\nWHERE users.id = photos.user_id\n  AND users.gender = 'female'\n  AND photos.description LIKE '%Sonne%'\nORDER BY users.username",
    "model": null,
    "hints": [
      "Die gesuchte Person ist die hochladende Person.",
      "Prüfe gender in users und description in photos.",
      "Verbinde die Tabellen über users.id und photos.user_id; DISTINCT entfernt wiederholte Personen."
    ],
    "feedback": {
      "success": "Korrekt: Die 18 passenden Personen erscheinen jeweils einmal.",
      "partial": "Teilweise korrekt: Prüfe beide Filter, DISTINCT und die verlangten Ausgabespalten.",
      "hint": "Noch nicht korrekt: Verbinde erst Person und Foto, bevor du nach Geschlecht und Beschreibung suchst."
    },
    "required": true
  },
  {
    "id": "P4",
    "type": "sql",
    "prompt": "**Liste** Benutzername und Kommentartext aller Kommentare von wanderwut_finn auf. Sortiere nach der Kommentar-ID.",
    "tables": [
      "users",
      "comments"
    ],
    "statement": "SELECT users.username, comments.body\nFROM users, comments\nWHERE users.id = comments.user_id\n  AND users.username = 'wanderwut_finn'\nORDER BY comments.id",
    "model": null,
    "hints": [
      "Der Kommentartext steht in comments.body.",
      "comments.user_id bezeichnet die Person, die den Kommentar geschrieben hat.",
      "Verbinde comments.user_id mit users.id und filtere dann den Benutzernamen."
    ],
    "feedback": {
      "success": "Korrekt: Die Kommentare sind ihren Verfasserinformationen richtig zugeordnet.",
      "partial": "Teilweise korrekt: Prüfe die Ausgabespalten oder die Sortierung nach comments.id.",
      "hint": "Noch nicht korrekt: Verwende comments.user_id für die verfassende Person."
    },
    "required": true
  },
  {
    "id": "P5",
    "type": "describe",
    "maxFeedbackHints": 1,
    "maxPoints": 5,
    "assessmentVersion": "20261029-ordering",
    "prompt": "**Beschreibe** in eigenen Worten, welche Kommentare diese Abfrage zeigt und was die beiden Bedingungen zusätzlich zur Verknüpfung auswählen. **Erkläre** auch die Sortierung.",
    "tables": [
      "users",
      "comments"
    ],
    "statement": "SELECT users.username, comments.body\nFROM users, comments\nWHERE users.id = comments.user_id\n  AND users.city = 'Hamburg'\n  AND comments.body LIKE '%Foto%'\nORDER BY users.username, comments.id",
    "model": "Die Abfrage zeigt Benutzernamen und Texte von Kommentaren, die Mitglieder aus Hamburg geschrieben haben und deren Text „Foto“ enthält. Die user_id des Kommentars wird mit der ID der verfassenden Person verbunden. Sortiert wird zuerst nach Benutzername von A bis Z, bei gleichem Benutzernamen nach Kommentar-ID aufsteigend.",
    "hints": [
      "Unterscheide die Verbindung von den zwei Filtern.",
      "city steht bei der Person, body beim Kommentar.",
      "Gesucht sind Kommentare aus Hamburg mit „Foto“ im Text, nicht Kommentare unter Fotos aus Hamburg. Prüfe außerdem die Angaben hinter ORDER BY und ihre Sortierrichtung."
    ],
    "feedback": {
      "success": "Korrekt: Du unterscheidest Verknüpfung, Stadtfilter und Textfilter.",
      "partial": "Teilweise korrekt: Ergänze eine der beiden Auswahlbedingungen oder die Rolle von comments.user_id.",
      "hint": "Noch nicht korrekt: Beschreibe, welche Kommentare und welche Verfasser ausgegeben werden."
    },
    "required": true
  },
  {
    "id": "P6",
    "type": "sql",
    "prompt": "**Liste** Benutzername und Beschreibung der Fotos mit dem Hashtag travelgram auf. Sortiere nach Benutzername und Foto-ID.",
    "tables": [
      "users",
      "photos",
      "tags"
    ],
    "statement": "SELECT users.username, photos.description\nFROM users, photos, tags\nWHERE users.id = photos.user_id\n  AND photos.id = tags.photo_id\n  AND tags.name = 'travelgram'\nORDER BY users.username, photos.id",
    "model": null,
    "hints": [
      "tags enthält den Hashtagtext und die Foto-ID.",
      "Verbinde zuerst photos.id mit tags.photo_id.",
      "Verbinde zusätzlich users.id mit photos.user_id; der Hashtagtext steht in tags.name ohne #."
    ],
    "feedback": {
      "success": "Korrekt: Die 54 Fotos sind mit ihren hochladenden Mitgliedern verbunden.",
      "partial": "Teilweise korrekt: Prüfe beide Schlüsselverbindungen und die Sortierung.",
      "hint": "Noch nicht korrekt: Für diese Ausgabe werden users, photos und tags benötigt."
    },
    "required": true
  },
  {
    "id": "P7",
    "type": "sql",
    "prompt": "**Ermittle** die Anzahl der von wanderwut_finn geschriebenen Kommentare. Gib eine Spalte anzahl_kommentare aus.",
    "tables": [
      "users",
      "comments"
    ],
    "statement": "SELECT COUNT(comments.id) AS anzahl_kommentare\nFROM users, comments\nWHERE users.id = comments.user_id\n  AND users.username = 'wanderwut_finn'",
    "model": null,
    "hints": [
      "Gezählt werden Kommentar-Datensätze.",
      "comments.user_id zeigt auf die verfassende Person.",
      "Verbinde users.id mit comments.user_id; COUNT(comments.id) zählt danach die 21 Zeilen."
    ],
    "feedback": {
      "success": "Korrekt: Das Mitglied hat 21 Kommentare geschrieben.",
      "partial": "Teilweise korrekt: Prüfe, ob du Kommentare statt Fotos zählst und den Alias ausgibst.",
      "hint": "Noch nicht korrekt: Zähle die Kommentare der verfassenden Person über comments.user_id."
    },
    "required": true
  },
  {
    "id": "P8",
    "type": "describe",
    "maxFeedbackHints": 1,
    "maxPoints": 5,
    "assessmentVersion": "20261029-ordering",
    "prompt": "**Beschreibe** in eigenen Worten, welche Personen und welches Foto diese Abfrage verbindet. Erkläre die Bedeutung der Foto-ID 10. **Erkläre** auch die Sortierung.",
    "tables": [
      "users",
      "likes",
      "photos"
    ],
    "statement": "SELECT users.username, photos.description\nFROM users, likes, photos\nWHERE users.id = likes.user_id\n  AND photos.id = likes.photo_id\n  AND photos.id = 10\nORDER BY users.username",
    "model": "Die Abfrage zeigt die Benutzernamen der Personen, die Foto 10 geliked haben, und dessen Beschreibung. likes.user_id ist die likende Person; likes.photo_id verweist auf das Foto. Die 10 wählt genau dieses Foto aus. Die Benutzernamen werden von A bis Z sortiert.",
    "hints": [
      "Betrachte die zwei Fremdschlüssel in likes.",
      "likes.user_id ist die likende, nicht die hochladende Person.",
      "Die Bedingung photos.id = 10 wählt ein Foto; die übrigen Bedingungen ordnen Likes und Personen zu. Prüfe außerdem die Angaben hinter ORDER BY und ihre Sortierrichtung."
    ],
    "feedback": {
      "success": "Korrekt: Du hast liker, Foto und beide Verbindungen richtig beschrieben.",
      "partial": "Teilweise korrekt: Prüfe, ob du likende und hochladende Person unterscheidest.",
      "hint": "Noch nicht korrekt: Lies die zwei Schlüssel in likes und die zusätzliche Foto-Auswahl getrennt."
    },
    "required": true
  },
  {
    "id": "P9",
    "type": "sql",
    "prompt": "**Ermittle** für jedes Mitglied aus Leipzig mit mindestens einem Foto den Benutzernamen und die Anzahl seiner hochgeladenen Fotos. Sortiere nach Fotoanzahl absteigend, dann nach Benutzername.",
    "tables": [
      "users",
      "photos"
    ],
    "statement": "SELECT users.username, COUNT(photos.id) AS anzahl_fotos\nFROM users, photos\nWHERE users.id = photos.user_id\n  AND users.city = 'Leipzig'\nGROUP BY users.id, users.username\nORDER BY anzahl_fotos DESC, users.username",
    "model": null,
    "hints": [
      "Eine Ergebniszeile soll zu genau einem Mitglied gehören.",
      "Verbinde die Fotozeilen zuerst mit ihrer hochladenden Person.",
      "Gruppiere nach Mitglieds-ID und Benutzername; COUNT(photos.id) zählt pro Gruppe."
    ],
    "feedback": {
      "success": "Korrekt: Die Fotoanzahl wird für jedes passende Mitglied getrennt gezählt.",
      "partial": "Teilweise korrekt: Prüfe GROUP BY, Stadtfilter und die geforderte Sortierung.",
      "hint": "Noch nicht korrekt: Ohne Gruppierung erhältst du keine eigene Anzahl je Mitglied."
    },
    "required": true
  },
  {
    "id": "P10",
    "type": "sql",
    "prompt": "**Ermittle** für jedes Mitglied aus Hamburg mit mindestens einem Follower den Benutzernamen und die Anzahl unterschiedlicher Follower. Sortiere nach Followerzahl absteigend, dann nach Benutzername.",
    "tables": [
      "users",
      "follows"
    ],
    "statement": "SELECT users.username, COUNT(DISTINCT follows.follower_id) AS anzahl_follower\nFROM users, follows\nWHERE users.id = follows.following_id\n  AND users.city = 'Hamburg'\nGROUP BY users.id, users.username\nORDER BY anzahl_follower DESC, users.username",
    "model": null,
    "hints": [
      "Follower sind die Personen, die einem Mitglied folgen.",
      "In follows ist following_id die ID des Mitglieds, dem gefolgt wird.",
      "Verbinde users.id mit follows.following_id; zähle DISTINCT follower_id wegen doppelter Beziehungen."
    ],
    "feedback": {
      "success": "Korrekt: Die unterschiedlichen Follower sind je Mitglied richtig gezählt.",
      "partial": "Teilweise korrekt: Prüfe die Richtung der Beziehung und DISTINCT.",
      "hint": "Noch nicht korrekt: following_id gehört zum Mitglied mit den Followern."
    },
    "required": true
  },
  {
    "id": "P11",
    "type": "describe",
    "maxFeedbackHints": 1,
    "maxPoints": 5,
    "assessmentVersion": "20261029-ordering",
    "prompt": "**Beschreibe** in eigenen Worten, welche Mitglieder und welche Anzahl diese Abfrage ausgibt. Erkläre, wozu GROUP BY dient. **Erkläre** auch die Sortierung.",
    "tables": [
      "users",
      "comments"
    ],
    "statement": "SELECT users.username, COUNT(comments.id) AS anzahl_kommentare\nFROM users, comments\nWHERE users.id = comments.user_id\n  AND users.city = 'Leipzig'\nGROUP BY users.id, users.username\nORDER BY anzahl_kommentare DESC, users.username",
    "model": "Für jedes Leipziger Mitglied mit mindestens einem geschriebenen Kommentar erscheint sein Benutzername und die Anzahl seiner Kommentare. comments.user_id ordnet die Kommentare den Verfassern zu. GROUP BY bildet für jedes Mitglied eine eigene Gruppe, damit COUNT je Person zählt. Sortiert wird zuerst nach Kommentaranzahl absteigend, bei gleicher Anzahl nach Benutzername von A bis Z.",
    "hints": [
      "Betrachte zuerst die beiden Ergebnisspalten.",
      "Die Stadtbedingung betrifft den Verfasser; Kommentare werden über comments.user_id zugeordnet.",
      "GROUP BY trennt die verbundenen Zeilen je Mitglied; COUNT zählt innerhalb dieser Gruppe. Prüfe außerdem die Angaben hinter ORDER BY und ihre Sortierrichtung."
    ],
    "feedback": {
      "success": "Korrekt: Ausgabe, Verfasserbeziehung und Gruppierung sind richtig erklärt.",
      "partial": "Teilweise korrekt: Ergänze die Wirkung von GROUP BY oder welche Kommentare gezählt werden.",
      "hint": "Noch nicht korrekt: Erkläre die Anzahl pro Mitglied statt nur die gesamte Kommentarzahl."
    },
    "required": true
  },
  {
    "id": "P12",
    "type": "sql",
    "prompt": "**Ermittle** die Anzahl der Like-Datensätze auf Fotos, die wanderwut_finn hochgeladen hat. Gib eine Spalte anzahl_likes aus.",
    "tables": [
      "users",
      "photos",
      "likes"
    ],
    "statement": "SELECT COUNT(likes.id) AS anzahl_likes\nFROM users, photos, likes\nWHERE users.id = photos.user_id\n  AND photos.id = likes.photo_id\n  AND users.username = 'wanderwut_finn'",
    "model": null,
    "hints": [
      "Gesucht sind Likes auf Fotos dieses Mitglieds, nicht seine eigenen Likes.",
      "users.id = photos.user_id findet die hochgeladenen Fotos.",
      "Verbinde diese Fotos über photos.id = likes.photo_id mit den Like-Zeilen und zähle likes.id."
    ],
    "feedback": {
      "success": "Korrekt: Auf die vier Fotos entfallen 57 Like-Datensätze.",
      "partial": "Teilweise korrekt: Prüfe, ob du erhaltene Likes statt abgegebener Likes zählst.",
      "hint": "Noch nicht korrekt: Verbinde erst hochladende Person und Foto, dann Foto und Likes."
    },
    "required": true
  },
  {
    "id": "Z1",
    "type": "sql",
    "prompt": "**Liste** Foto-ID und Hashtagname aller Fotos auf, die wanderwut_finn hochgeladen hat. Sortiere nach Foto-ID und Hashtagname.",
    "tables": [
      "users",
      "photos",
      "tags"
    ],
    "statement": "SELECT photos.id, tags.name\nFROM users, photos, tags\nWHERE users.id = photos.user_id\n  AND photos.id = tags.photo_id\n  AND users.username = 'wanderwut_finn'\nORDER BY photos.id, tags.name",
    "model": null,
    "hints": [
      "Ein Foto kann mehrere Zeilen in tags haben.",
      "Die Foto-ID verbindet photos und tags.",
      "Die hochladende Person findest du über photos.user_id; gib für jede Tag-Zeile Foto-ID und Tagname aus."
    ],
    "feedback": {
      "success": "Korrekt: Die Hashtags der Fotos sind richtig zugeordnet.",
      "partial": "Teilweise korrekt: Prüfe die beiden Verknüpfungen und beide Sortierspalten.",
      "hint": "Noch nicht korrekt: tags.name gehört über tags.photo_id zu einem Foto."
    },
    "required": false
  },
  {
    "id": "Z2",
    "type": "sql",
    "prompt": "**Liste** Benutzername, Kommentartext und Fotobeschreibung für alle Kommentare zu Foto 10 auf. Sortiere nach Kommentar-ID.",
    "tables": [
      "users",
      "comments",
      "photos"
    ],
    "statement": "SELECT users.username, comments.body, photos.description\nFROM users, comments, photos\nWHERE users.id = comments.user_id\n  AND comments.photo_id = photos.id\n  AND photos.id = 10\nORDER BY comments.id",
    "model": null,
    "hints": [
      "comments hat zwei Fremdschlüssel mit verschiedenen Rollen.",
      "comments.user_id führt zum Verfasser, comments.photo_id zum Foto.",
      "Verbinde beide Schlüssel mit den IDs der Zieltabellen und filtere photos.id = 10."
    ],
    "feedback": {
      "success": "Korrekt: Alle fünf Kommentare zeigen Verfasser und Foto.",
      "partial": "Teilweise korrekt: Prüfe die drei Ausgabespalten und die Sortierung.",
      "hint": "Noch nicht korrekt: Verwechsle Verfasser und hochladende Person nicht."
    },
    "required": false
  },
  {
    "id": "Z3",
    "type": "sql",
    "prompt": "**Liste** Benutzername und Name aller unterschiedlichen Mitglieder auf, denen Mitglied 2 folgt. Sortiere nach Benutzername.",
    "tables": [
      "users",
      "follows"
    ],
    "statement": "SELECT DISTINCT users.username, users.name\nFROM users, follows\nWHERE users.id = follows.following_id\n  AND follows.follower_id = 2\nORDER BY users.username",
    "model": null,
    "hints": [
      "Mitglied 2 ist hier die folgende Person.",
      "Suche diese ID in follows.follower_id.",
      "Die gesuchten Personen stehen in follows.following_id; DISTINCT entfernt doppelte Beziehungen."
    ],
    "feedback": {
      "success": "Korrekt: Die 22 unterschiedlichen gefolgten Mitglieder erscheinen.",
      "partial": "Teilweise korrekt: Prüfe die Beziehungsrichtung und DISTINCT.",
      "hint": "Noch nicht korrekt: follower_id ist die Person, die folgt."
    },
    "required": false
  },
  {
    "id": "Z4",
    "type": "sql",
    "prompt": "**Liste** URL und Beschreibung der Fotos auf, die Mitglieder aus München hochgeladen haben und die den Hashtag travelgram tragen. Sortiere nach Foto-ID.",
    "tables": [
      "users",
      "photos",
      "tags"
    ],
    "statement": "SELECT photos.url, photos.description\nFROM users, photos, tags\nWHERE users.id = photos.user_id\n  AND photos.id = tags.photo_id\n  AND users.city = 'München'\n  AND tags.name = 'travelgram'\nORDER BY photos.id",
    "model": null,
    "hints": [
      "Die Stadt steht in users, der Hashtag in tags.",
      "Beide Filter beziehen sich auf dasselbe Foto.",
      "Verbinde users mit photos und photos mit tags; füge danach beide Filter mit AND hinzu."
    ],
    "feedback": {
      "success": "Korrekt: Das passende Foto ist mit beiden Bedingungen gefunden.",
      "partial": "Teilweise korrekt: Prüfe beide Filter und die zwei Verbindungen.",
      "hint": "Noch nicht korrekt: Ein Foto muss zugleich zur Stadt und zum Hashtag passen."
    },
    "required": false
  },
  {
    "id": "Z5",
    "type": "sql",
    "prompt": "**Ermittle** Name, Benutzername, E-Mail-Adresse und Fotoanzahl der zehn Mitglieder mit den meisten hochgeladenen Fotos. Sortiere nach Fotoanzahl absteigend, bei Gleichstand nach Benutzername.",
    "tables": [
      "users",
      "photos"
    ],
    "statement": "SELECT users.name, users.username, users.email,\n       COUNT(photos.id) AS anzahl_fotos\nFROM users, photos\nWHERE users.id = photos.user_id\nGROUP BY users.id, users.name, users.username, users.email\nORDER BY anzahl_fotos DESC, users.username\nLIMIT 10",
    "model": null,
    "hints": [
      "Zähle Fotos je hochladender Person.",
      "GROUP BY benötigt eine Gruppe pro Mitglied.",
      "Sortiere erst nach COUNT absteigend und begrenze danach mit LIMIT 10."
    ],
    "feedback": {
      "success": "Korrekt: Die zehn Mitglieder mit den meisten Fotos sind passend geordnet.",
      "partial": "Teilweise korrekt: Prüfe Gruppierung, Tie-Breaker und LIMIT 10.",
      "hint": "Noch nicht korrekt: Eine Gesamtsumme ist keine Top-10-Liste pro Mitglied."
    },
    "required": false
  },
  {
    "id": "Z6",
    "type": "sql",
    "prompt": "**Ermittle** URL, Beschreibung und Anzahl der Like-Datensätze für die zehn Fotos mit den meisten Likes. Sortiere nach Likezahl absteigend, bei Gleichstand nach Foto-ID.",
    "tables": [
      "photos",
      "likes"
    ],
    "statement": "SELECT photos.url, photos.description,\n       COUNT(likes.id) AS anzahl_likes\nFROM photos, likes\nWHERE photos.id = likes.photo_id\nGROUP BY photos.id, photos.url, photos.description\nORDER BY anzahl_likes DESC, photos.id\nLIMIT 10",
    "model": null,
    "hints": [
      "Jeder Like-Datensatz verweist auf ein Foto.",
      "Gruppiere nach Foto statt nach Mitglied.",
      "Verbinde photos.id mit likes.photo_id und sortiere die gezählten Like-Zeilen absteigend."
    ],
    "feedback": {
      "success": "Korrekt: Die zehn am häufigsten gelikten Fotos sind passend geordnet.",
      "partial": "Teilweise korrekt: Prüfe, ob du Like-Datensätze pro Foto zählst.",
      "hint": "Noch nicht korrekt: likes.photo_id führt zum gelikten Foto."
    },
    "required": false
  },
  {
    "id": "Z7",
    "type": "sql",
    "prompt": "**Ermittle** URL, Beschreibung und Anzahl der Kommentar-Datensätze für die zehn meistkommentierten Fotos. Sortiere nach Kommentarzahl absteigend, bei Gleichstand nach Foto-ID.",
    "tables": [
      "photos",
      "comments"
    ],
    "statement": "SELECT photos.url, photos.description,\n       COUNT(comments.id) AS anzahl_kommentare\nFROM photos, comments\nWHERE photos.id = comments.photo_id\nGROUP BY photos.id, photos.url, photos.description\nORDER BY anzahl_kommentare DESC, photos.id\nLIMIT 10",
    "model": null,
    "hints": [
      "comments.photo_id verweist auf das kommentierte Foto.",
      "Gruppiere die Kommentarzeilen nach Foto.",
      "Zähle comments.id je Foto, sortiere absteigend und verwende LIMIT 10."
    ],
    "feedback": {
      "success": "Korrekt: Die zehn meistkommentierten Fotos sind passend geordnet.",
      "partial": "Teilweise korrekt: Prüfe die gezählten Zeilen und die Sortierung.",
      "hint": "Noch nicht korrekt: Die Anzahl muss für jedes Foto einzeln entstehen."
    },
    "required": false
  },
  {
    "id": "Z8",
    "type": "sql",
    "prompt": "**Ermittle** Name, Benutzername und Anzahl unterschiedlicher Follower für die zehn Mitglieder mit den meisten Followern. Sortiere nach Followerzahl absteigend, bei Gleichstand nach Benutzername.",
    "tables": [
      "users",
      "follows"
    ],
    "statement": "SELECT users.name, users.username,\n       COUNT(DISTINCT follows.follower_id) AS anzahl_follower\nFROM users, follows\nWHERE users.id = follows.following_id\nGROUP BY users.id, users.name, users.username\nORDER BY anzahl_follower DESC, users.username\nLIMIT 10",
    "model": null,
    "hints": [
      "Ein Mitglied empfängt Follower über following_id.",
      "Doppelte Beziehungszeilen dürfen dieselbe Person nicht zweimal zählen.",
      "Verbinde users.id mit follows.following_id und verwende COUNT(DISTINCT follows.follower_id)."
    ],
    "feedback": {
      "success": "Korrekt: Die Top 10 zählt unterschiedliche Follower.",
      "partial": "Teilweise korrekt: Prüfe DISTINCT, die Schlüsselrichtung und LIMIT 10.",
      "hint": "Noch nicht korrekt: Zähle die folgenden Personen beim Mitglied in following_id."
    },
    "required": false
  },
  {
    "id": "Z9",
    "type": "sql",
    "prompt": "**Liste** Foto-ID, URL und Anzahl der Hashtag-Datensätze aller Fotos mit genau zwei Hashtags auf. Sortiere nach Foto-ID.",
    "tables": [
      "photos",
      "tags"
    ],
    "statement": "SELECT photos.id, photos.url,\n       COUNT(tags.id) AS anzahl_hashtags\nFROM photos, tags\nWHERE photos.id = tags.photo_id\nGROUP BY photos.id, photos.url\nHAVING COUNT(tags.id) = 2\nORDER BY photos.id",
    "model": null,
    "hints": [
      "Die Anzahl ist eine Eigenschaft der ganzen Fotogruppe.",
      "WHERE filtert Zeilen vor, HAVING Gruppen nach dem Zählen.",
      "Gruppiere nach Foto-ID und URL; behalte mit HAVING nur Gruppen mit COUNT(tags.id) = 2."
    ],
    "feedback": {
      "success": "Korrekt: Die 50 Fotos mit genau zwei Hashtag-Zeilen erscheinen.",
      "partial": "Teilweise korrekt: Prüfe, ob HAVING die gezählte Gruppe einschränkt.",
      "hint": "Noch nicht korrekt: Ein Vergleich mit COUNT gehört nach GROUP BY in HAVING."
    },
    "required": false
  },
  {
    "id": "Z10",
    "type": "sql",
    "prompt": "**Liste** die Benutzernamen der Mitglieder mit mindestens 40 selbst geschriebenen Kommentaren und die jeweilige Kommentarzahl auf. Sortiere nach Kommentarzahl absteigend, bei Gleichstand nach Benutzername.",
    "tables": [
      "users",
      "comments"
    ],
    "statement": "SELECT users.username,\n       COUNT(comments.id) AS anzahl_kommentare\nFROM users, comments\nWHERE users.id = comments.user_id\nGROUP BY users.id, users.username\nHAVING COUNT(comments.id) >= 40\nORDER BY anzahl_kommentare DESC, users.username",
    "model": null,
    "hints": [
      "Hier sollen nur ganze Mitgliedsgruppen mit ausreichend Kommentaren bleiben.",
      "COUNT(comments.id) entsteht nach GROUP BY.",
      "Verbinde Kommentare mit ihren Verfassern und prüfe die Anzahl mit HAVING >= 40."
    ],
    "feedback": {
      "success": "Korrekt: Sieben Mitglieder erreichen mindestens 40 Kommentare.",
      "partial": "Teilweise korrekt: Prüfe HAVING und die Verfasserbeziehung.",
      "hint": "Noch nicht korrekt: Filtere Gruppen nach der Kommentarzahl, nicht einzelne Kommentarzeilen."
    },
    "required": false
  },
  {
    "id": "Z11",
    "type": "sql",
    "prompt": "**Liste** die Texte aller Kommentare zu Fotos auf, die wanderwut_finn hochgeladen hat. Verwende eine Unterabfrage und sortiere nach Kommentar-ID.",
    "tables": [
      "users",
      "photos",
      "comments"
    ],
    "statement": "SELECT comments.body\nFROM comments\nWHERE comments.photo_id IN (\n  SELECT photos.id\n  FROM users, photos\n  WHERE users.id = photos.user_id\n    AND users.username = 'wanderwut_finn'\n)\nORDER BY comments.id",
    "model": null,
    "hints": [
      "Die innere Suche soll Foto-IDs liefern.",
      "Die äußere Suche wählt Kommentare mit einer dieser photo_id-Werte.",
      "Verbinde innen Mitglied und Fotos; verwende außen comments.photo_id IN (...)."
    ],
    "feedback": {
      "success": "Korrekt: Die Kommentare zu den Fotos dieses Mitglieds sind gefunden.",
      "partial": "Teilweise korrekt: Prüfe, ob die innere Abfrage Foto-IDs liefert.",
      "hint": "Noch nicht korrekt: Vergleiche comments.photo_id mit den hochgeladenen Foto-IDs."
    },
    "required": false
  },
  {
    "id": "Z12",
    "type": "sql",
    "prompt": "**Liste** URL und Beschreibung der Fotos auf, die wanderwut_finn geliked hat. Verwende eine Unterabfrage und sortiere nach Foto-ID.",
    "tables": [
      "users",
      "likes",
      "photos"
    ],
    "statement": "SELECT photos.url, photos.description\nFROM photos\nWHERE photos.id IN (\n  SELECT likes.photo_id\n  FROM users, likes\n  WHERE users.id = likes.user_id\n    AND users.username = 'wanderwut_finn'\n)\nORDER BY photos.id",
    "model": null,
    "hints": [
      "Dieses Mal ist das Mitglied die likende Person.",
      "Die innere Abfrage soll die Foto-IDs seiner Likes liefern.",
      "Verbinde innen users.id mit likes.user_id und verwende außen photos.id IN (...)."
    ],
    "feedback": {
      "success": "Korrekt: Die 87 gelikten Fotos erscheinen.",
      "partial": "Teilweise korrekt: Prüfe, ob du gelikte statt hochgeladene Fotos auswählst.",
      "hint": "Noch nicht korrekt: likes.user_id bezeichnet die likende Person."
    },
    "required": false
  },
  {
    "id": "Z13",
    "type": "sql",
    "prompt": "**Liste** Benutzername und Name aller unterschiedlichen Follower von wanderwut_finn auf. Verwende eine Unterabfrage und sortiere nach Benutzername.",
    "tables": [
      "users",
      "follows"
    ],
    "statement": "SELECT DISTINCT users.username, users.name\nFROM users, follows\nWHERE users.id = follows.follower_id\n  AND follows.following_id = (\n    SELECT id\n    FROM users\n    WHERE username = 'wanderwut_finn'\n  )\nORDER BY users.username",
    "model": null,
    "hints": [
      "Die innere Abfrage findet die ID des Mitglieds, dem gefolgt wird.",
      "Diese ID gehört in follows.following_id.",
      "Die äußere Abfrage verbindet follows.follower_id mit users.id; DISTINCT verhindert doppelte Personen."
    ],
    "feedback": {
      "success": "Korrekt: Die 21 unterschiedlichen Follower erscheinen.",
      "partial": "Teilweise korrekt: Prüfe Unterabfrage, Schlüsselrichtung und DISTINCT.",
      "hint": "Noch nicht korrekt: following_id bezeichnet die Person mit den Followern."
    },
    "required": false
  }
];
