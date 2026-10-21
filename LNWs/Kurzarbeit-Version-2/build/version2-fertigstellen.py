from pathlib import Path

root = Path(__file__).resolve().parent.parent
stem = 'kurzarbeit-informatik-klasse-10-datenbanken'
path = root / (stem + '.tex')
source = path.read_text(encoding='utf-8')
start = source.index(r'\sectiontitle{4.')
source = source[:start] + r'''\sectiontitle{4. Appentwickler\bewertung{5}}
Ein Appentwickler kann mehrere Apps entwickeln. Jede App wird in diesem Szenario von genau einem Appentwickler entwickelt.\par\vspace{2mm}
\begin{minipage}[t][18mm][t]{\linewidth}
\ifsolution
\schematext{App (id: int [PS], appentwickler\_id: int [FS],}
\schematext{\hspace{4mm}name: varchar(255), erscheinungsdatum: date,}
\schematext{\hspace{4mm}kategorie: varchar(255))}
{\small\color{Blue}\texttt{appentwickler\_id} verweist auf \texttt{Appentwickler.id}.}\par
\else
\schematext{App (id: int [PS], name: varchar(255),}
\schematext{\hspace{4mm}erscheinungsdatum: date, kategorie: varchar(255))}
\fi
\end{minipage}\par
{\small Verwendete Abkürzungen: PS = Primärschlüssel, FS = Fremdschlüssel.}\par\vspace{2mm}
\textbf{a) Beschreibe} folgende SQL-Anweisung in eigenen Worten.
\par\vspace{1mm}{\small\ttfamily\hspace{4mm}SELECT COUNT(*)\\
\hspace*{4mm}FROM Appentwickler\\
\hspace*{4mm}WHERE gruendungsjahr < 2025\par}
\gridfield{30mm}{Die Anweisung zählt die Appentwickler, die \textbf{vor dem Jahr 2025} gegründet wurden. Ausgegeben wird eine einzelne Zahl. Appentwickler mit Gründungsjahr 2025 werden nicht mitgezählt.}
\vspace{2mm}
\schematext{Appentwickler (id: int [PS], name: varchar(255), gruendungsjahr: int)}
\vspace{1mm}
\begin{tikzpicture}
\node[anchor=north west,inner sep=0pt,align=left,font=\small\ttfamily] (schema) at (0,0) {Zuordnung-Apps-Appentwickler (\\
\hspace*{4mm}app\_id: int [FS $\rightarrow$ App.id],\\
\hspace*{4mm}appentwickler\_id: int [FS $\rightarrow$ Appentwickler.id])};
\ifsolution
\draw[overlay,Blue,line width=.9pt] (schema.south west) -- (schema.north east);
\node[overlay,anchor=west,font=\small\bfseries,text=Blue] at ([xshift=4mm]schema.east) {entfällt};
\fi
\end{tikzpicture}\par
{\small In \texttt{Zuordnung-Apps-Appentwickler} bildet das Paar der beiden Fremdschlüssel den Primärschlüssel.}\par\vspace{2mm}
\textbf{b)} In den Tabellenschemata Apps, Appentwickler bzw. Zuordnung-Apps-Appentwickler haben sich Fehler eingeschlichen. \textbf{Korrigiere} den Fehler oder die Fehler. Du kannst direkt in das Tabellenschema hineinschreiben und Falsches durchstreichen, wenn notwendig.\par
\textbf{Begründe} deine Änderungen.
\gridfield{30mm}{Es liegt eine \textbf{1:n-Beziehung} zwischen Appentwickler und App vor. Die Zuordnungstabelle ist überflüssig und wird gestrichen. In \texttt{App} wird \texttt{appentwickler\_id: int [FS]} ergänzt; dieser Fremdschlüssel verweist auf \texttt{Appentwickler.id}. So ist jede App genau einem Entwickler zugeordnet. Das Schema \texttt{Appentwickler} bleibt unverändert.}
\vspace{2mm}
\textbf{c) Korrigiere} zwei Fehler, die in folgender SQL-Anweisung passiert sind. Schreibe die SQL-Anweisung darunter neu.
\par\vspace{1mm}{\fontsize{9.2}{11.2}\selectfont\ttfamily\hspace{4mm}SELECT\\
\hspace*{4mm}FROM Appentwickler, App\\
\hspace*{4mm}WHERE App.id = Appentwickler.id AND App.name = Appentwickler.name\par}
\gridfield{45mm}{{\ttfamily\fontsize{9}{11}\selectfont SELECT Appentwickler.name, App.name\\
FROM Appentwickler, App\\
WHERE App.appentwickler\_id = Appentwickler.id;}\par\smallskip Die Abfrage verwendet das in 4b korrigierte Schema. Eine mögliche Spaltenauswahl. Die fehlende SELECT-Liste wird ergänzt; die falsche Verknüpfung wird durch den Vergleich von Fremd- und Primärschlüssel ersetzt. Die zusätzliche Gleichheit der Namen entfällt.}
\par\vspace{2mm}{\bfseries Gesamt:\bewertung{25}}\par
\fuss{3}
\end{document}
'''
path.write_text(source,encoding='utf-8')
(root / (stem + '-loesungen.tex')).write_text(source.replace('\\solutionfalse','\\solutiontrue',1),encoding='utf-8')
print('Version 2 und Musterloesung fertiggestellt.')
