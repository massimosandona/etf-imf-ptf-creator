# ETF IMF Ptf Creator

Un'applicazione web per creare e ottimizzare portafogli di ETF con interfaccia intuitiva.

## Funzionalità

- 📊 Caricamento database ETF da file CSV
- 🎯 Allocazione personalizzata per macro-categorie (Obbligazionari, Azionari, Materie Prime, Immobiliare)
- 🔍 Filtri avanzati per distribuzione, replica e valuta
- 📈 Visualizzazione grafica dell'allocazione
- 💰 Calcolo automatico del TER medio ponderato
- 📋 Export dettagliato del portafoglio con lista ISIN

## Requisiti CSV

Il file CSV deve contenere le seguenti colonne:
- Nome
- ISIN
- Ticker
- Categoria
- Categoria Morningstar
- TER
- Valuta
- AuM (Mln EUR)
- Distribuzione
- Replica

## Installazione

```bash
npm install
npm start