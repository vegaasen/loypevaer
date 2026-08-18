import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { allArrangements } from "../lib/arrangements";
import { SITE_URL } from "../lib/seo";
import { PageMeta } from "../components/PageMeta";

const pageUrl = `${SITE_URL}/hva-er-loypevaer`;
const pageTitle = "Hva er løypevær? – Vær for sykkelritt, triathlon og ultraløp | Løypevær";
const description =
  "Løypevær er værmeldingen du trenger før et sykkelritt, triathlon eller ultraløp. Les om hvorfor vær betyr alt i utholdenhetsidretten og sjekk løypevær for ditt arrangement.";

const sykkelritt = allArrangements.filter(
  (r) => r.discipline === "landevei" || r.discipline === "terreng",
).slice(0, 6);

const triathlon = allArrangements.filter((r) => r.discipline === "triathlon").slice(0, 6);

const ultra = allArrangements.filter((r) => r.discipline === "ultraløp").slice(0, 6);

const langrenn = allArrangements.filter((r) => r.discipline === "langrenn").slice(0, 6);

export function HvaErLoypevaerPage() {
  return (
    <div className="ritt-page">
      <PageMeta
        title={pageTitle}
        description={description}
        canonicalUrl={pageUrl}
        ogType="article"
      />
      <Helmet>
        <meta
          name="keywords"
          content="løypevær, rittvær, sykkelvær, løpsvær, triathlonvær, langrennvær, terrengvær, arrangementvær"
        />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: "Hva er løypevær?",
            description,
            url: pageUrl,
            inLanguage: "nb-NO",
            author: {
              "@type": "Organization",
              name: "Løypevær",
              url: SITE_URL,
            },
            publisher: {
              "@type": "Organization",
              name: "Løypevær",
              url: SITE_URL,
            },
          })}
        </script>
      </Helmet>

      <Link to="/" className="ritt-page__back-link">← Alle arrangement</Link>

      <header className="ritt-page__header">
        <div className="ritt-page__title-row">
          <h1>Hva er løypevær?</h1>
        </div>
        <p className="ritt-page__lead">
          Løypevær er været du møter langs løypa under et sykkelritt, triathlon, ultraløp
          eller langrenn — ikke bare ved starten, men ved hvert eneste punkt langs ruten.
        </p>
      </header>

      <div className="ritt-page__article">
        <section>
          <h2>Hvorfor er løypevær viktig?</h2>
          <p>
            I utholdenhetsidretten er vær en av de viktigste faktorene for prestasjon og
            sikkerhet. Et sykkelritt på 90 km kan ta deg fra varmt og vindstille i dalen til
            kaldt og blåsende på fjellovergangen — alt i løpet av noen timer. Uten riktig
            løypevær-informasjon risikerer du å starte med for lett bekledning, bruke for lite
            energi i motbakkene eller bli tatt på sengen av regn eller snø.
          </p>
          <p>
            Løypevær skiller seg fra vanlig stedsvær fordi du beveger deg gjennom ulike
            høydenivåer og klimasoner i løpet av arrangementet. Løypevær beregner
            timebaserte værvarsler for hvert nøkkelpunkt langs ruten — tilpasset din
            starttid.
          </p>
        </section>

        <section>
          <h2>Sykkelvær for sykkelritt</h2>
          <p>
            Norske sykkelritt som Birkebeinerrittet, Styrkeprøven og Jotunheimen Rundt
            strekker seg over hundrevis av kilometer og store høydeforskjeller. Sykkelvær
            handler om å kjenne vindretning (med- eller motvind), temperatur i
            bakker og på topper, og sjansen for regn som kan gjøre veidekket glatt.
          </p>
          {sykkelritt.length > 0 && (
            <ul>
              {sykkelritt.map((r) => (
                <li key={r.id}>
                  <Link to={`/arrangement/${r.id}`}>
                    Sjekk løypevær for {r.name} ({r.region})
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2>Triathlonvær – vær for svømming, sykkel og løping</h2>
          <p>
            Triathlon er ekstra værkrevende fordi du starter i vannet og avslutter løpende.
            Triathlonvær inkluderer bølgehøyde og vanntemperatur for svømmeetappen, vind
            og kuling på sykkelen, og varme eller kulde under løpeetappen. Løypevær viser
            triathlonvær for hvert segment langs ruten.
          </p>
          {triathlon.length > 0 && (
            <ul>
              {triathlon.map((r) => (
                <li key={r.id}>
                  <Link to={`/arrangement/${r.id}`}>
                    Sjekk triathlonvær for {r.name} ({r.region})
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {triathlon.length === 0 && (
            <p>
              <Link to="/">Se alle arrangement</Link> for triathlonvær.
            </p>
          )}
        </section>

        <section>
          <h2>Løpsvær for ultraløp og maraton</h2>
          <p>
            Et ultraløp kan ta mange timer, og løpsvær endrer seg underveis. Varme øker
            risikoen for dehydrering; kulde og vind gjør det farlig å stoppe. Løypevær
            beregner løpsvær langs hele traseen, slik at du kan planlegge påkledning,
            drikkestrategi og tempo etter forholdene.
          </p>
          {ultra.length > 0 && (
            <ul>
              {ultra.map((r) => (
                <li key={r.id}>
                  <Link to={`/arrangement/${r.id}`}>
                    Sjekk løpsvær for {r.name} ({r.region})
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {ultra.length === 0 && (
            <p>
              <Link to="/">Se alle arrangement</Link> for løpsvær.
            </p>
          )}
        </section>

        <section>
          <h2>Vær for langrenn og skiarrangement</h2>
          <p>
            Langrenn er avhengig av snøforhold, temperatur og vind. Skiføret varierer mye
            fra start til mål i kuperte løyper. Riktig skismøring og bekledning krever at
            du kjenner langrennværet — ikke bare for startstedet, men for hele løypa.
          </p>
          {langrenn.length > 0 && (
            <ul>
              {langrenn.map((r) => (
                <li key={r.id}>
                  <Link to={`/arrangement/${r.id}`}>
                    Sjekk rennvær for {r.name} ({r.region})
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {langrenn.length === 0 && (
            <p>
              <Link to="/">Se alle arrangement</Link> for skivær og rennvær.
            </p>
          )}
        </section>

        <section>
          <h2>Historisk løypevær vs. sanntidsvarsel</h2>
          <p>
            Løypevær kombinerer to datakilder for å gi deg best mulig løypevær:
          </p>
          <ul>
            <li>
              <strong>Sanntidsvarsel (0–16 dager):</strong> Timebaserte varsler direkte fra
              Open-Meteo for hvert waypoint langs ruten — oppdatert daglig.
            </li>
            <li>
              <strong>Historisk klimasnitt:</strong> For arrangement langt frem i tid bruker
              vi 15 års historiske data for samme dato og sted. Du ser hva du statistisk
              sett kan forvente av løypevær.
            </li>
          </ul>
        </section>

        <section>
          <h2>Sjekk løypevær for ditt arrangement</h2>
          <p>
            Løypevær dekker {allArrangements.length} norske utholdenhetsarrangement — fra
            Nordkapp til Sørlandet, sykkelritt, langrenn, triathlon og ultraløp.
          </p>
          <Link to="/" className="ritt-page__article-cta">
            Se alle arrangement →
          </Link>
        </section>
      </div>
    </div>
  );
}
