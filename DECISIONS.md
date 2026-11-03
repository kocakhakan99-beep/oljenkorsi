# Arkkitehtuuripäätökset

## ADR-001: Offline-first single-file architecture

Status: Accepted
Version 1 is distributed as a standalone HTML file that can be opened directly from the local filesystem using the file:// protocol. No server, installation, internet connection, cloud service or user account is required. React and TypeScript are development technologies, not runtime requirements for the end user. This constraint takes precedence over PWA functionality, remote APIs, cloud synchronization and other future features. Future online functionality must be introduced as optional adapters and must not compromise the standalone offline version.

## ADR-002: React + TypeScript

Accepted. React UI, strict TypeScript ja erillinen domain-laskenta. Kehitystyökalut bundlataan tai poistuvat buildissa.

## ADR-003: Vite

Accepted. Production build, base ./, ei modulepreloadia, yksi JS-kokonaisuus. Vite dev ei ole jakelutapa.

## ADR-004: Single-file build

Accepted. Eksplisiittinen standalone-jälkikäsittely upottaa JS/CSS:n ja tuottaa vain yhden HTML:n.

## ADR-005: File navigation

Accepted. Hash ja React state; ei BrowserRouteria tai palvelimen fallbackia.

## ADR-006: Local storage architecture

Accepted. StorageProvider ja localStorage; JSON-backup ydintoimintona. Ei yleistä pysyvyyslupausta file://-ympäristöille.

## ADR-007: Integer money

Accepted. Tallennus sentteinä, validoidut turvalliset kokonaisluvut. Prosenttiskaalaukset pyöristetään sentteihin.

## ADR-008: Data migrations

Accepted. Skeema 1, tuntemattomat versiot hylätään. Tuleva migraatio tehdään eksplisiittisesti ennen uuden skeeman julkaisua.

## ADR-009: JSON backup

Accepted. Täysi tila, paikallinen vienti/palautus, esikatselu, vahvistus ja FNV-1a-32 tahattoman korruption tarkistukseen. Ei kryptografista aitouslupausta.

## ADR-010: Manual investment valuation

Accepted. Käyttäjän EUR-hinnat. Ei API:a tai näennäistä kurssidataa.

## ADR-011: Adapter architecture

Accepted as direction, not implemented beyond StorageProvider. Online-adapterit lisätään vasta tarpeeseen. Ei turhaa enterprise-abstraktiota.

## ADR-012: First delivery scope

Accepted. 0.1.0 on rajattu toimiva käyttöversio. Kaikki alkuperäisen V1:n vaatimukset eivät ole valmiita; rajaukset dokumentoidaan eikä näytetä fake-painikkeita.
