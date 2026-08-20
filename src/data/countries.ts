import type { MetricId } from "./metrics";

export type Region =
  | "Africa"
  | "Americas"
  | "Asia"
  | "Europe"
  | "Oceania"
  | "Polar";

export type CountryRecord = {
  key: string;
  iso3: string;
  name: string;
  region: Region;
  capital: string;
  population: number | null;
  gdpPpp: number | null;
  gdpPerCapita: number | null;
  lifeExpectancy: number | null;
  hdi: number | null;
  co2PerCapita: number | null;
  density: number | null;
  area: number | null;
};

const RAW = `
004|AFG|Afghanistan|Asia|Kabul|42239854|87|1990|64.2|0.462|0.28|65|652230
008|ALB|Albania|Europe|Tirana|2771508|58|18000|79.5|0.796|1.7|100|28748
012|DZA|Algeria|Africa|Algiers|45606480|745|15600|77.1|0.745|3.9|19|2381741
024|AGO|Angola|Africa|Luanda|36684202|280|7300|64.6|0.591|0.8|29|1246700
010|ATA|Antarctica|Polar||null|null|null|null|null|null|null|14200000
032|ARG|Argentina|Americas|Buenos Aires|46057748|1240|26500|76.1|0.849|3.7|17|2780400
051|ARM|Armenia|Asia|Yerevan|2973840|61|20500|75.1|0.786|2.0|101|29743
036|AUS|Australia|Oceania|Canberra|26643743|1720|65000|83.3|0.946|14.8|3.5|7692024
040|AUT|Austria|Europe|Vienna|9120813|630|69000|81.6|0.926|6.8|109|83871
031|AZE|Azerbaijan|Asia|Baku|10412651|200|19000|73.6|0.760|3.5|120|86600
044|BHS|Bahamas|Americas|Nassau|412623|16|38000|74.4|0.820|5.2|41|13880
050|BGD|Bangladesh|Asia|Dhaka|171466990|1490|8500|73.7|0.670|0.6|1265|147570
112|BLR|Belarus|Europe|Minsk|9174526|221|24000|73.1|0.808|6.2|45|207600
056|BEL|Belgium|Europe|Brussels|11686140|760|65000|81.9|0.942|7.5|383|30528
084|BLZ|Belize|Americas|Belmopan|410274|5|12000|73.6|0.700|1.6|18|22966
204|BEN|Benin|Africa|Porto-Novo|13712894|57|4000|60.8|0.525|0.6|121|112622
064|BTN|Bhutan|Asia|Thimphu|787424|11|14000|72.2|0.681|2.0|21|38394
068|BOL|Bolivia|Americas|Sucre|12388571|125|10000|68.8|0.698|1.8|11|1098581
070|BIH|Bosnia and Herzegovina|Europe|Sarajevo|3210847|63|19500|76.2|0.780|6.2|62|51209
072|BWA|Botswana|Africa|Gaborone|2675352|50|18500|66.1|0.708|2.6|5|582000
076|BRA|Brazil|Americas|Brasília|216422446|4100|19000|75.5|0.760|2.2|25|8515767
096|BRN|Brunei|Asia|Bandar Seri Begawan|452524|34|75000|75.3|0.823|16.0|83|5765
100|BGR|Bulgaria|Europe|Sofia|6516502|216|33000|74.9|0.799|5.9|59|110879
854|BFA|Burkina Faso|Africa|Ouagadougou|23251485|63|2700|61.8|0.449|0.2|85|274200
108|BDI|Burundi|Africa|Gitega|13238559|12|900|63.8|0.426|0.05|475|27834
116|KHM|Cambodia|Asia|Phnom Penh|17363780|98|5600|70.7|0.600|1.1|95|181035
120|CMR|Cameroon|Africa|Yaoundé|28647293|132|4600|62.3|0.587|0.4|61|475442
124|CAN|Canada|Americas|Ottawa|40097761|2370|58000|82.3|0.935|14.2|4|9984670
140|CAF|Central African Republic|Africa|Bangui|5742315|6|1100|55.5|0.387|0.07|9|622984
148|TCD|Chad|Africa|N'Djamena|18278568|32|1700|54.0|0.394|0.06|14|1284000
152|CHL|Chile|Americas|Santiago|19629590|610|31000|80.7|0.860|4.4|26|756102
156|CHN|China|Asia|Beijing|1411750000|33000|23300|78.2|0.788|8.0|149|9596961
170|COL|Colombia|Americas|Bogotá|52321152|980|18700|76.5|0.758|1.6|46|1141748
178|COG|Congo|Africa|Brazzaville|6106869|25|4100|64.6|0.571|1.2|18|342000
188|CRI|Costa Rica|Americas|San José|5212173|141|27000|80.3|0.809|1.5|102|51100
384|CIV|Côte d'Ivoire|Africa|Yamoussoukro|28873034|202|7000|60.1|0.550|0.5|90|322463
191|HRV|Croatia|Europe|Zagreb|3855897|164|42000|78.5|0.878|4.1|68|56594
192|CUB|Cuba|Americas|Havana|11194449|137|12300|78.2|0.764|2.2|102|109884
196|CYP|Cyprus|Europe|Nicosia|1260138|50|49000|81.7|0.907|5.6|136|9251
203|CZE|Czechia|Europe|Prague|10827529|540|50000|79.2|0.895|8.7|139|78867
180|COD|DR Congo|Africa|Kinshasa|102262808|155|1500|61.2|0.481|0.03|45|2344858
208|DNK|Denmark|Europe|Copenhagen|5946952|440|74000|81.9|0.952|5.1|138|43094
262|DJI|Djibouti|Africa|Djibouti|1136455|7|6100|65.0|0.509|0.5|49|23200
214|DOM|Dominican Republic|Americas|Santo Domingo|11332972|255|23000|74.0|0.766|2.3|234|48671
218|ECU|Ecuador|Americas|Quito|18190484|243|13300|77.4|0.765|2.2|72|256370
818|EGY|Egypt|Africa|Cairo|112716598|1910|17000|71.8|0.728|2.3|113|1002450
222|SLV|El Salvador|Americas|San Salvador|6364943|75|11700|73.1|0.675|1.1|307|21041
226|GNQ|Equatorial Guinea|Africa|Malabo|1714671|28|16500|61.2|0.596|6.5|61|28051
232|ERI|Eritrea|Africa|Asmara|3748901|7|1800|66.5|0.492|0.2|32|117600
233|EST|Estonia|Europe|Tallinn|1364884|61|45000|78.5|0.899|7.0|31|45227
748|SWZ|Eswatini|Africa|Mbabane|1210822|13|11000|57.1|0.611|0.9|70|17364
231|ETH|Ethiopia|Africa|Addis Ababa|126527060|393|3100|66.6|0.492|0.16|112|1104300
238|FLK|Falkland Islands|Americas|Stanley|3500|0.2|70000|78.0|null|18|0.29|12173
242|FJI|Fiji|Oceania|Suva|936375|14|14000|68.3|0.729|1.8|51|18274
246|FIN|Finland|Europe|Helsinki|5577457|335|60000|82.0|0.942|6.5|18|338424
260|ATF|French Southern Lands|Polar||null|null|null|null|null|null|null|439781
250|FRA|France|Europe|Paris|68287487|3900|56000|82.5|0.910|4.6|123|551695
266|GAB|Gabon|Africa|Libreville|2436566|41|16800|65.8|0.693|2.8|9|267668
270|GMB|Gambia|Africa|Banjul|2773168|8|2800|64.1|0.500|0.25|260|11295
268|GEO|Georgia|Asia|Tbilisi|3728282|80|22000|73.5|0.802|2.7|54|69700
276|DEU|Germany|Europe|Berlin|84482267|5500|65000|81.1|0.950|7.9|240|357114
288|GHA|Ghana|Africa|Accra|34121985|227|6700|64.7|0.602|0.6|144|238533
300|GRC|Greece|Europe|Athens|10341277|417|40000|81.5|0.893|5.6|79|131957
304|GRL|Greenland|Americas|Nuuk|56609|3.4|60000|71.6|null|9.0|0.03|2166086
320|GTM|Guatemala|Americas|Guatemala City|18135108|198|11000|72.8|0.629|1.0|167|108889
324|GIN|Guinea|Africa|Conakry|14190612|51|3600|60.7|0.465|0.3|58|245857
624|GNB|Guinea-Bissau|Africa|Bissau|2150842|5|2400|60.2|0.483|0.16|60|36125
328|GUY|Guyana|Americas|Georgetown|813834|49|60000|69.5|0.742|4.0|4|214969
332|HTI|Haiti|Americas|Port-au-Prince|11724763|38|3200|64.8|0.552|0.3|423|27750
340|HND|Honduras|Americas|Tegucigalpa|10593798|75|7100|72.9|0.624|1.0|95|112492
348|HUN|Hungary|Europe|Budapest|9599374|412|43000|76.4|0.851|4.5|105|93028
352|ISL|Iceland|Europe|Reykjavík|393453|27|69000|82.7|0.959|10.8|4|103000
356|IND|India|Asia|New Delhi|1428627663|14500|10100|72.0|0.644|1.9|481|3287263
360|IDN|Indonesia|Asia|Jakarta|277534122|4400|15700|71.1|0.713|2.3|153|1904569
364|IRN|Iran|Asia|Tehran|89172767|1700|19000|76.2|0.780|8.3|55|1648195
368|IRQ|Iraq|Asia|Baghdad|45504560|560|12300|71.3|0.673|4.0|104|438317
372|IRL|Ireland|Europe|Dublin|5255017|690|126000|82.4|0.950|7.3|72|70273
376|ISR|Israel|Asia|Jerusalem|9756000|530|54000|82.7|0.915|6.3|426|22072
380|ITA|Italy|Europe|Rome|58870762|3200|54000|83.2|0.906|5.4|200|301340
388|JAM|Jamaica|Americas|Kingston|2839772|34|12000|72.4|0.709|2.5|266|10991
392|JPN|Japan|Asia|Tokyo|124516650|6500|52000|84.5|0.920|8.1|338|377975
400|JOR|Jordan|Asia|Amman|11337052|132|11600|75.2|0.736|2.3|128|89342
398|KAZ|Kazakhstan|Asia|Astana|19606633|690|35000|71.5|0.802|14.4|7|2724900
404|KEN|Kenya|Africa|Nairobi|55100586|342|6200|63.6|0.601|0.4|94|580367
name:Kosovo|XKX|Kosovo|Europe|Pristina|1786038|28|15000|77.4|0.762|3.5|165|10887
414|KWT|Kuwait|Asia|Kuwait City|4310108|256|54000|79.3|0.847|21.0|241|17818
417|KGZ|Kyrgyzstan|Asia|Bishkek|6803210|49|7200|71.9|0.701|1.5|34|199951
418|LAO|Laos|Asia|Vientiane|7633779|71|9300|69.0|0.620|2.5|32|236800
428|LVA|Latvia|Europe|Riga|1830211|78|42000|75.4|0.879|3.5|29|64559
422|LBN|Lebanon|Asia|Beirut|5489739|78|14200|75.0|0.723|3.8|523|10452
426|LSO|Lesotho|Africa|Maseru|2305825|6|2700|54.7|0.521|1.1|76|30355
430|LBR|Liberia|Africa|Monrovia|5418377|9|1600|62.2|0.487|0.2|56|111369
434|LBY|Libya|Africa|Tripoli|6888388|160|23000|72.9|0.718|8.5|4|1759540
440|LTU|Lithuania|Europe|Vilnius|2857279|137|48000|76.0|0.879|4.2|44|65300
442|LUX|Luxembourg|Europe|Luxembourg|654768|90|140000|82.6|0.927|13.0|256|2586
807|MKD|North Macedonia|Europe|Skopje|1832696|44|24000|75.8|0.770|3.6|72|25713
450|MDG|Madagascar|Africa|Antananarivo|30325732|51|1700|65.2|0.501|0.15|52|587041
454|MWI|Malawi|Africa|Lilongwe|20931751|37|1700|64.7|0.512|0.08|177|118484
458|MYS|Malaysia|Asia|Kuala Lumpur|34308525|1230|36000|75.6|0.807|8.6|99|330803
466|MLI|Mali|Africa|Bamako|23293698|61|2600|60.0|0.410|0.18|19|1240192
478|MRT|Mauritania|Africa|Nouakchott|4862989|33|6800|65.5|0.556|0.9|5|1030700
484|MEX|Mexico|Americas|Mexico City|128455567|3100|24000|75.0|0.781|3.5|66|1964375
498|MDA|Moldova|Europe|Chișinău|2511106|43|17000|71.2|0.763|3.3|74|33846
496|MNG|Mongolia|Asia|Ulaanbaatar|3447157|55|16000|72.0|0.741|11.0|2|1564116
499|MNE|Montenegro|Europe|Podgorica|616250|17|27000|76.8|0.844|3.6|45|13812
504|MAR|Morocco|Africa|Rabat|37840044|390|10300|74.8|0.698|1.8|85|446550
508|MOZ|Mozambique|Africa|Maputo|33897354|53|1500|61.0|0.461|0.2|43|801590
104|MMR|Myanmar|Asia|Naypyidaw|54577997|270|5000|67.3|0.585|0.7|83|676578
name:N. Cyprus|NCY|Northern Cyprus|Europe|North Nicosia|382836|4|11000|78.0|null|4.0|113|3355
516|NAM|Namibia|Africa|Windhoek|2604172|30|11500|64.0|0.610|1.6|3|825615
524|NPL|Nepal|Asia|Kathmandu|30896590|151|4900|70.5|0.601|0.6|214|147181
528|NLD|Netherlands|Europe|Amsterdam|17877117|1280|71000|82.1|0.946|8.4|531|41850
540|NCL|New Caledonia|Oceania|Nouméa|271407|11|40000|77.7|null|16.0|15|18575
554|NZL|New Zealand|Oceania|Wellington|5223100|260|50000|82.5|0.939|6.5|20|268021
558|NIC|Nicaragua|Americas|Managua|7046310|51|7300|74.6|0.669|0.8|58|130373
562|NER|Niger|Africa|Niamey|27202843|47|1700|62.8|0.400|0.09|21|1267000
566|NGA|Nigeria|Africa|Abuja|223804632|1360|6100|54.5|0.548|0.6|246|923768
408|PRK|North Korea|Asia|Pyongyang|26160816|40|1500|73.3|null|1.6|216|120538
578|NOR|Norway|Europe|Oslo|5550203|460|83000|83.2|0.966|7.5|17|323802
512|OMN|Oman|Asia|Muscat|4644370|200|43000|78.6|0.819|15.3|15|309500
586|PAK|Pakistan|Asia|Islamabad|240485658|1560|6500|67.6|0.540|0.9|302|881913
275|PSE|Palestine|Asia|Ramallah|5371230|36|6700|74.3|0.716|0.6|847|6020
591|PAN|Panama|Americas|Panama City|4464104|191|43000|78.3|0.820|2.7|59|75417
598|PNG|Papua New Guinea|Oceania|Port Moresby|10329931|42|4100|66.1|0.568|0.8|23|462840
600|PRY|Paraguay|Americas|Asunción|6861524|117|17000|73.8|0.731|1.2|17|406752
604|PER|Peru|Americas|Lima|34352720|550|16000|76.7|0.762|1.7|27|1285216
608|PHL|Philippines|Asia|Manila|117337368|1350|11500|72.2|0.710|1.2|394|300000
616|POL|Poland|Europe|Warsaw|36753736|1620|44000|77.4|0.881|7.6|120|312696
620|PRT|Portugal|Europe|Lisbon|10342593|470|45000|82.0|0.874|4.0|112|92212
630|PRI|Puerto Rico|Americas|San Juan|3221789|132|41000|80.2|null|2.8|360|9104
634|QAT|Qatar|Asia|Doha|2716391|326|114000|81.6|0.875|32.0|235|11586
642|ROU|Romania|Europe|Bucharest|19056116|780|41000|75.6|0.827|3.7|82|238397
643|RUS|Russia|Europe|Moscow|144044359|5100|35000|72.6|0.821|12.5|9|17098246
646|RWA|Rwanda|Africa|Kigali|14094683|42|3000|67.5|0.548|0.11|535|26338
728|SSD|South Sudan|Africa|Juba|11078318|14|1200|56.5|0.381|0.15|17|644329
682|SAU|Saudi Arabia|Asia|Riyadh|36947334|2250|59000|77.9|0.875|18.0|17|2149690
686|SEN|Senegal|Africa|Dakar|18050134|78|4300|68.7|0.511|0.6|92|196722
688|SRB|Serbia|Europe|Belgrade|6643374|173|26000|75.6|0.805|5.2|76|88361
694|SLE|Sierra Leone|Africa|Freetown|8791092|18|2000|60.8|0.458|0.13|122|71740
703|SVK|Slovakia|Europe|Bratislava|5428792|230|42000|77.8|0.855|5.7|114|49035
705|SVN|Slovenia|Europe|Ljubljana|2119675|106|50000|81.3|0.926|6.2|104|20273
090|SLB|Solomon Islands|Oceania|Honiara|740424|2|2700|70.7|0.562|0.4|26|28896
706|SOM|Somalia|Africa|Mogadishu|18143378|32|1800|56.5|0.380|0.05|29|637657
name:Somaliland|SOL|Somaliland|Africa|Hargeisa|5700000|5|900|55.0|null|0.1|32|176120
710|ZAF|South Africa|Africa|Pretoria|60414495|990|16000|64.1|0.717|6.9|50|1221037
410|KOR|South Korea|Asia|Seoul|51740000|2920|56000|83.7|0.929|11.6|527|100210
724|ESP|Spain|Europe|Madrid|48373336|2400|49000|83.5|0.911|5.0|96|505990
144|LKA|Sri Lanka|Asia|Sri Jayawardenepura Kotte|22037000|319|14500|76.6|0.780|1.0|341|65610
729|SDN|Sudan|Africa|Khartoum|48109006|180|3700|65.6|0.508|0.5|26|1861484
740|SUR|Suriname|Americas|Paramaribo|623236|11|18000|72.6|0.690|4.6|4|163820
752|SWE|Sweden|Europe|Stockholm|10536632|700|66000|83.1|0.952|3.6|26|450295
756|CHE|Switzerland|Europe|Bern|8900474|750|84000|84.0|0.967|4.0|219|41285
760|SYR|Syria|Asia|Damascus|23227014|50|2200|72.1|0.557|1.4|125|185180
158|TWN|Taiwan|Asia|Taipei|23375314|1680|72000|81.0|0.926|11.0|652|36197
762|TJK|Tajikistan|Asia|Dushanbe|10143543|54|5300|71.3|0.679|0.9|71|143100
834|TZA|Tanzania|Africa|Dodoma|67438106|228|3400|66.8|0.549|0.2|76|947303
764|THA|Thailand|Asia|Bangkok|71701278|1570|22000|76.4|0.803|3.7|140|513120
626|TLS|Timor-Leste|Asia|Dili|1360596|5|3700|69.5|0.566|0.4|91|14874
768|TGO|Togo|Africa|Lomé|9053799|25|2700|62.7|0.547|0.3|166|56785
780|TTO|Trinidad and Tobago|Americas|Port of Spain|1534937|44|29000|74.7|0.814|22.0|298|5128
788|TUN|Tunisia|Africa|Tunis|12482217|159|12700|76.5|0.732|2.4|79|163610
792|TUR|Turkey|Asia|Ankara|85816199|3600|42000|78.5|0.855|4.8|110|783562
795|TKM|Turkmenistan|Asia|Ashgabat|6516100|126|19000|69.4|0.744|11.0|13|488100
800|UGA|Uganda|Africa|Kampala|48565645|141|2900|64.1|0.550|0.13|242|241550
804|UKR|Ukraine|Europe|Kyiv|36744636|560|15000|71.6|0.773|3.6|61|603550
784|ARE|United Arab Emirates|Asia|Abu Dhabi|9516871|840|88000|79.2|0.937|20.0|114|83600
826|GBR|United Kingdom|Europe|London|67736802|3900|57000|81.3|0.940|4.7|279|242495
840|USA|United States|Americas|Washington, D.C.|339996563|27800|82000|77.5|0.927|14.4|37|9833517
858|URY|Uruguay|Americas|Montevideo|3423108|103|30000|78.0|0.830|1.9|20|176215
860|UZB|Uzbekistan|Asia|Tashkent|35652307|371|10400|71.7|0.727|3.4|80|447400
548|VUT|Vanuatu|Oceania|Port Vila|334506|1|3200|70.5|0.614|0.6|27|12189
862|VEN|Venezuela|Americas|Caracas|28838499|210|7300|72.1|0.699|3.1|32|912050
704|VNM|Vietnam|Asia|Hanoi|98858950|1440|14500|74.6|0.726|3.5|311|331212
732|ESH|Western Sahara|Africa|Laayoune|582463|null|null|70.0|null|0.5|2|266000
887|YEM|Yemen|Asia|Sana'a|34449825|70|2000|66.2|0.424|0.3|65|527968
894|ZMB|Zambia|Africa|Lusaka|20569737|85|4100|63.9|0.569|0.4|28|752612
716|ZWE|Zimbabwe|Africa|Harare|16665409|44|2600|62.8|0.550|0.7|43|390757
`.trim();

function num(value: string): number | null {
  if (value === "" || value === "null") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export const COUNTRIES: CountryRecord[] = RAW.split("\n").map((line) => {
  const [
    key,
    iso3,
    name,
    region,
    capital,
    population,
    gdpPpp,
    gdpPerCapita,
    lifeExpectancy,
    hdi,
    co2PerCapita,
    density,
    area,
  ] = line.split("|");
  return {
    key,
    iso3,
    name,
    region: region as Region,
    capital,
    population: num(population),
    gdpPpp: num(gdpPpp),
    gdpPerCapita: num(gdpPerCapita),
    lifeExpectancy: num(lifeExpectancy),
    hdi: num(hdi),
    co2PerCapita: num(co2PerCapita),
    density: num(density),
    area: num(area),
  };
});

export const COUNTRY_BY_KEY = new Map(COUNTRIES.map((c) => [c.key, c]));

export const ANTARCTICA_KEY = "010";

export function metricValue(
  country: CountryRecord | undefined,
  metric: MetricId,
): number | null {
  if (!country) return null;
  const value = country[metric];
  return value == null ? null : value;
}

export function rankedCountries(metric: MetricId): CountryRecord[] {
  return COUNTRIES.filter((c) => metricValue(c, metric) != null).sort(
    (a, b) => (metricValue(b, metric) ?? 0) - (metricValue(a, metric) ?? 0),
  );
}

export function countryRank(
  key: string,
  metric: MetricId,
): { rank: number; total: number } | null {
  const list = rankedCountries(metric);
  const index = list.findIndex((c) => c.key === key);
  if (index < 0) return null;
  return { rank: index + 1, total: list.length };
}

export function worldTotal(metric: MetricId): number {
  return COUNTRIES.reduce((sum, c) => sum + (metricValue(c, metric) ?? 0), 0);
}
