// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

import { metricBenchmarkSchema, RawMetricBenchmark } from "../MetricBenchmark";
import {
  ADVERSE_METRIC_IDS,
  CASELOAD_TYPE_IDS,
  LOOKBACK_END_DATE_STRINGS,
} from "./constants";

export const rawMetricBenchmarksFixture = [
  {
    metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
    caseloadType: CASELOAD_TYPE_IDS.enum.GENERAL_OR_OTHER,
    benchmarks: LOOKBACK_END_DATE_STRINGS.map((endDate) => ({
      target: 0.17139496103300086,
      endDate,
    })),
    latestPeriodValues: {
      far: [
        0.2725914861837192, 0.272817872269745, 0.27455995185798104,
        0.276111741503215, 0.2772452707346186, 0.277989337395278,
        0.2785019393399885, 0.2831408377865885, 0.2912543887647622,
        0.2915472442794719, 0.2922337870296237, 0.2937936877780132,
        0.29626623376623373, 0.30474713740458015, 0.3048887716521586,
        0.30706135969293863, 0.307708519943095, 0.3079995499549955,
        0.3099568324959309, 0.3142294920673964, 0.3150776903894111,
        0.3200242800296756, 0.32399804713505836, 0.3290713875911811,
        0.33728630833204987, 0.33903028051272527, 0.343319381084513,
        0.3547516198704104, 0.35740133679594704, 0.36772113640942977,
        0.4143742904549821, 0.4224537037037037, 0.44411611333217454,
        0.4517326732673267, 0.475144414612318, 0.4821664464993395,
        0.4925775978407557, 0.5419760137064534, 0.7250916870415648,
      ],
      met: [
        0.016269222197459327, 0.019969362074625234, 0.020006029214283755,
        0.03228850293397812, 0.032921439523766576, 0.03508771929824561,
        0.03664658634538153, 0.03677026142144764, 0.03814799331103679,
        0.038274668810514174, 0.04152682177598271, 0.04249951484572094,
        0.045562351766321306, 0.04570307608831755, 0.04756939919197185,
        0.04834010241921243, 0.049592391304347824, 0.05454506639340763,
        0.05531979387693241, 0.057794315572797086, 0.062443864676446685,
        0.06680699185503798, 0.06894272087642253, 0.06914515747099219,
        0.06960999332506913, 0.07094955778015356, 0.07097370084098974,
        0.07101858157408308, 0.07228199881180276, 0.07379887279803878,
        0.07396899381902929, 0.07471852610030706, 0.07480274618301055,
        0.07487947481793004, 0.07703440166430489, 0.07721599323037867,
        0.07805260531755649, 0.07856558612079728, 0.08083089733368766,
        0.08287920072661217, 0.08326679593931789, 0.08362736562342482,
        0.08576127819548872, 0.08599701562868138, 0.08717805819832014,
        0.08741258741258741, 0.09157049673858504, 0.09259729057790858,
        0.09281863493032244, 0.0931624174016619, 0.09335038363171355,
        0.09390879269312406, 0.09510515540666295, 0.09517187432097692,
        0.09582882084605034, 0.0961943917351887, 0.09678702435143854,
        0.0969198088157196, 0.09714828897338404, 0.09764057567813386,
        0.09817105970952125, 0.09841811971957577, 0.09846616309542161,
        0.10261744777755911, 0.10352931642286965, 0.10357180860497286,
        0.10564399421128798, 0.10572219361483007, 0.10829075325531565,
        0.10929779907171731, 0.11115461585312798, 0.11124657116732704,
        0.11269490042710853, 0.11276743647176952, 0.11312567797923448,
        0.11344652084385563, 0.11353621234900721, 0.11378248840743485,
        0.1142839251048907, 0.11502791283990635, 0.11533296468915397,
        0.11613724346396563, 0.1162420382165605, 0.11658548271181027,
        0.11768770152003685, 0.11798660817363196, 0.11930270564735791,
        0.11952657185628743, 0.1203176505843572, 0.12034785475827392,
        0.12087593658152916, 0.12101319541144487, 0.12103268593083848,
        0.12213485025932742, 0.12343591477849172, 0.12364498644986449,
        0.12443053274243035, 0.12460645601790388, 0.12486102796544941,
        0.1255589955280358, 0.12581145516171655, 0.1258674942885469,
        0.1266628108733372, 0.12715997770345597, 0.12754804892253932,
        0.12808141065005701, 0.12969707737407835, 0.1300726090249009,
        0.13034550486563698, 0.1304836320923344, 0.13148414985590778,
        0.1315019139833371, 0.1320151907890771, 0.13264527383072283,
        0.13473606496862311, 0.13491867915229178, 0.13506974096214064,
        0.13517517220946595, 0.13591003872505214, 0.13643159730874657,
        0.13705059607622266, 0.13716003569918736, 0.13830520151567344,
        0.13832743810005055, 0.13871075008313144, 0.13909097207787707,
        0.13925223457597558, 0.13937947494033412, 0.13964801049409709,
        0.14079617343002623, 0.14120529573590096, 0.14152772392400156,
        0.1422225685785536, 0.14253437839948677, 0.14255425988952744,
        0.14302507836990597, 0.1442453033901965, 0.14519978783592646,
        0.14550942536590922, 0.14581918421157763, 0.14612221130399972,
        0.14646216951268448, 0.14704401248866955, 0.14824141012102995,
        0.14833780378769404, 0.14854843085827982, 0.14911348966418825,
        0.14968729708485698, 0.14984698066731356, 0.15024992649220817,
        0.15121027401313844, 0.15184832996552955, 0.1523089762611276,
        0.15239447204709616, 0.15280186591711023, 0.1529665329581512,
        0.15316113390525923, 0.1543258812959146, 0.1557879332947166,
        0.1566971951917573, 0.15707707535396134, 0.1571982302963862,
        0.15798235392042617, 0.15833423706756317, 0.1585577758470895,
        0.1599863634149905, 0.15999415546464055, 0.1606, 0.16069384520560007,
        0.16140240050536955, 0.16200621393697293, 0.16219338784216136,
        0.16339137830699674, 0.16346286344219377, 0.1636037651277454,
        0.16371995664037678, 0.16393442622950818, 0.1643650555388772,
        0.16466165413533834, 0.16498417959921652, 0.16518951536865925,
        0.16534006341810653, 0.16535290386880494, 0.16577513120710535,
        0.1658261778201808, 0.16608272284661238, 0.1664159029772489,
        0.16772495613668642, 0.16793619958079853, 0.16823506817745343,
        0.16945873795798352, 0.16994309363683394, 0.1700574623388725,
        0.17053901371957697,
      ],
      near: [
        0.17304045512010116, 0.17347908745247148, 0.17689562497246333,
        0.1775605872987794, 0.17780192603140105, 0.1782487669092152,
        0.1788976518290781, 0.1793378069463904, 0.1806291975963238,
        0.18096182449181952, 0.18152430685067764, 0.1817211948790896,
        0.18263045032165834, 0.1828133552271483, 0.1845764854614412,
        0.18469110814664888, 0.18553032870213487, 0.18558273543867576,
        0.1865793020121753, 0.18930132622064164, 0.18969579377728502,
        0.18977722673279207, 0.19051008303677341, 0.19065030033951422,
        0.19192250861927435, 0.19202441077441076, 0.19216042883124343,
        0.1926398618174839, 0.19405308927961112, 0.19512629750077962,
        0.19676549865229107, 0.1968450856141297, 0.1978766659137113,
        0.19872597593510102, 0.19877675840978593, 0.19931112697945982,
        0.20254023059374807, 0.20349959257194322, 0.20360437674318815,
        0.20385884742320384, 0.20400705103400835, 0.20415501398322014,
        0.20453908657887365, 0.20515702943862854, 0.20537569252077562,
        0.20838685735491422, 0.2094811753902663, 0.21050530145068988,
        0.21050699942326848, 0.2106782106782107, 0.21072031263877786,
        0.21120804771654944, 0.21269363375904435, 0.2131905573132149,
        0.2150537634408602, 0.2153459197615203, 0.21584010092249467,
        0.21630212261609738, 0.2169759245891894, 0.21733952602119805,
        0.21830143540669855, 0.21866575377637043, 0.2191022477156006,
        0.22040112141470777, 0.22071353966247045, 0.2214410620605974,
        0.22162540868752917, 0.22196320883798712, 0.22324159021406728,
        0.22693193870460449, 0.22899965144649703, 0.22938269488959354,
        0.2305942804194921, 0.2306234203875316, 0.23191168294813755,
        0.23347547974413646, 0.23424249369699748, 0.2342747111681643,
        0.23450733017931197, 0.23497078340101019, 0.23910037120605576,
        0.23990009639821225, 0.24080488207158174, 0.2413793103448276,
        0.24182040566710836, 0.24572033083285247, 0.2461227242076871,
        0.24689038367592347, 0.250257113472746, 0.2503810975609756,
        0.2516497586920122, 0.2516621521792662, 0.2521763161531021,
        0.25372393247269115, 0.25718524012608934, 0.2575258701787394,
        0.2579505300353357, 0.25987351844871637, 0.26091759812841175,
        0.2615784287377945, 0.2622000862027681, 0.26413491489160873,
        0.2657541228293713, 0.26613197229310975, 0.2665294742432289,
        0.26710574460300035, 0.26997041420118345, 0.2702327518393411,
        0.2716110628798214,
      ],
    },
  },
  {
    benchmarks: LOOKBACK_END_DATE_STRINGS.map((endDate) => ({
      target: 0.06030045665489481,
      endDate,
    })),
    caseloadType: CASELOAD_TYPE_IDS.enum.GENERAL_OR_OTHER,
    metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
    latestPeriodValues: {
      far: [
        0.10914418994079302, 0.10941656986547757, 0.11293316831683167,
        0.11367175334786671, 0.11447389054414302, 0.11521464646464646,
        0.1172335034438457, 0.12070105820105821, 0.12125238767544223,
        0.1453797132235794, 0.1466368227731864, 0.1604677745537677,
        0.16732885085574573, 0.17811084001394215, 0.18264611689351481,
        0.20845231296402056, 0.3634553149116256,
      ],
      met: [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0.01017449963762056, 0.010426486131345161, 0.010800414262464862,
        0.011311866612948213, 0.011312567797923449, 0.012574066418630288,
        0.012902085542594557, 0.013264527383072284, 0.013440860215053762,
        0.013622452787937596, 0.014066594727917372, 0.014609934755633831,
        0.014824141012102996, 0.015173560590313863, 0.015286677555806845,
        0.015372952027966139, 0.015462825672527008, 0.015610966169111671,
        0.015618982412597886, 0.015937472709807003, 0.015993339759880817,
        0.01614187157261631, 0.016166179466737533, 0.016212134671759793,
        0.016339137830699672, 0.016348651796112158, 0.01639344262295082,
        0.01640301995326263, 0.016460719761883288, 0.016575840145322436,
        0.01664159029772489, 0.016790100740604445, 0.01679241810820758,
        0.01716596905422565, 0.017402498331267283, 0.017690965490500195,
        0.017743425210247434, 0.01821629984528622, 0.01849693406983226,
        0.01871986870448251, 0.01878248340451809, 0.01900942659236498,
        0.019356207243994273, 0.019456289978678036, 0.019791779633445396,
        0.019949715784871012, 0.020779960148021637, 0.02078706076655846,
        0.021110468478889532, 0.02124975742286047, 0.02131884819811927,
        0.0214642752131726, 0.022047053849173992, 0.022634255239985118,
        0.023057485786481365, 0.02430497752621941, 0.024344694190622292,
        0.024947882847476163, 0.02514640027557699, 0.02528926765052311,
        0.025892952151243216, 0.025960170697012803, 0.026017535105852165,
        0.026566707911783973, 0.026671538180489587, 0.026697875141718175,
        0.02703503444189319, 0.027182007745010426, 0.027417501231324908,
        0.027432264852880386, 0.02781164279183176, 0.02804887420272036,
        0.028109356950327298, 0.028159234686005247, 0.028581496417524763,
        0.02858709273182957, 0.02916383684231553, 0.02919649642042955,
        0.029696525913269874, 0.03037490117754754, 0.030785234333267734,
        0.03128213918409325, 0.031378954607977995, 0.031385700159078204,
        0.03146009308739872, 0.031466873572136726, 0.03154165226408572,
        0.03238543099241383, 0.032399804713505835, 0.03241850963673505,
        0.03249354580254607, 0.03254714878059655, 0.032586376216409245,
        0.03272075302554908, 0.032875478495834276, 0.03297944431895188,
        0.03309256852730515, 0.03340349592751899, 0.03346321338528536,
        0.03392350945675914, 0.03403580753450205, 0.03409621672115833,
        0.034150449101796404, 0.034471360438211265, 0.03482159893150162,
        0.03521579725992153, 0.03550929078704154, 0.03564975338184304,
        0.03593580781726888, 0.035949965527430315, 0.036246276067527304,
        0.03630395862343346, 0.03652556789752827, 0.036562671045429665,
        0.03676100312216739, 0.03677026142144764, 0.036772113640942974,
        0.03691529709228824, 0.037281037740666975, 0.037865034493490324,
        0.037939158755457, 0.03813006006790284, 0.03827399989513972,
        0.038274668810514174, 0.03838266996161733, 0.038437236731255264,
        0.038463564992886876, 0.03847775669407548, 0.03858147032397865,
        0.03913509649749822, 0.03932765865747225, 0.03944453450045929,
        0.03971276248503971, 0.039851512173818104, 0.03993872414925047,
        0.040711616753109144, 0.040929989160094195, 0.04124060787526128,
        0.04129737884216481, 0.041405518845183065, 0.04153548533930129,
        0.041582804845630955, 0.041633397969658946, 0.041937151720572184,
        0.04213564213564214, 0.04266843315278807, 0.04292097836312324,
        0.04316802018449893, 0.04320293543232527, 0.04346790520423961,
        0.04358902909916007, 0.04359076433121019, 0.043719556016928854,
        0.04497289305076392, 0.04513044553435272, 0.04571357004195628,
        0.04593650693767108, 0.04610914603335018, 0.046510640105339174,
        0.04685494223363287, 0.04698562540227419, 0.047228811731723094,
        0.04724001811945901, 0.04739439058171745, 0.04758593716048846,
        0.048208153561680026, 0.04839992927864215, 0.04877722838433784,
        0.048781574375194904, 0.04879026868065767, 0.049516143619426606,
        0.04974785334605424, 0.0501764193740549, 0.05043526323062042,
        0.05052602436323366, 0.0507696587537092, 0.05090513514267385,
        0.051289257359657135, 0.051435013387195264, 0.05144951369637739,
        0.05165947208265515, 0.05201653128117429, 0.052096714338728554,
        0.05280862299707021, 0.05302342473215907, 0.053297639328303725,
        0.05392760403841418, 0.05486040656821854, 0.05491199037159621,
        0.05547674536427196, 0.055804709000101926, 0.05581039755351682,
        0.05621438472200831, 0.05638371823588476, 0.0566699788846106,
        0.058151885289431764, 0.058734552008238926, 0.0596177927805303,
        0.06016152958628647, 0.060194601726128304, 0.060201220517895435,
      ],
      near: [
        0.060508102283559205, 0.061162079510703356, 0.06229023266397406,
        0.06230086481565772, 0.06283083014158454, 0.06285246889663783,
        0.06404070532502851, 0.06445346989228325, 0.06457700586795624,
        0.06507785569951266, 0.06574207492795389, 0.06643853070734282,
        0.0665971588687606, 0.06666423144360023, 0.06676625712630711,
        0.06733489115729922, 0.06768032634897088, 0.06780605610254506,
        0.06927639383155397, 0.06955030487804878, 0.07001726453098024,
        0.07017543859649122, 0.07060780748249314, 0.0711593449441123,
        0.07151253918495298, 0.07229870258492621, 0.07332630204409622,
        0.07394951173062118, 0.07416890189384702, 0.0754599958652057,
        0.0766581257613307, 0.07703440166430489, 0.07769594278172762,
        0.07826907406613201, 0.07883369330453564, 0.07957270547198604,
        0.08151870463428253, 0.08213321332133214, 0.0821627948856474,
        0.08326996197718631, 0.0850320326150262, 0.08620689655172414,
        0.08649972351686547, 0.08696688110555158, 0.08734564946874701,
        0.08740944740465785, 0.08756357355340177, 0.08888131300832805,
        0.0914366832282577, 0.09329788865599918, 0.09465066311032082,
        0.09731603270529683,
      ],
    },
  },
  {
    benchmarks: LOOKBACK_END_DATE_STRINGS.map((endDate) => ({
      target: 0.04833977875065241,
      endDate,
    })),
    metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
    caseloadType: CASELOAD_TYPE_IDS.enum.GENERAL_OR_OTHER,
    latestPeriodValues: {
      far: [
        0.08987934006402364, 0.0908638287279064, 0.09370988446726573,
        0.09568499973784932, 0.09595667490404332, 0.10038964015585607,
        0.1033189441653103, 0.10673406299607317, 0.10948748714432636,
        0.11447389054414302, 0.11595584147406877, 0.11650175550590487,
        0.12686196623634557, 0.13060591603053434, 0.1358055314399107,
        0.13761467889908255, 0.1453797132235794, 0.1538677720789714,
        0.15539188556345523, 0.157310634629889, 0.16072214883311317,
        0.16159976387249114, 0.16426642664266428, 0.17050763002180006,
        0.18822194719471946, 0.33465770171149145,
      ],
      near: [
        0.04859970707025875, 0.048658016352648416, 0.048740318703819105,
        0.048781574375194904, 0.04879026868065767, 0.04887956432461387,
        0.04931321774375141, 0.05037725432462274, 0.050885264185138716,
        0.052096714338728554, 0.05251294839823518, 0.053150824565874256,
        0.05339575028343635, 0.05347463007276456, 0.053924948291145476,
        0.05400207131232431, 0.054144261079176706, 0.055640243902439025,
        0.05592155661100046, 0.05607835605915114, 0.056218713900654596,
        0.05668582077962416, 0.057162992835049525, 0.05717418546365914,
        0.057195090101854265, 0.058292741355905134, 0.05933512151507762,
        0.05939305182653975, 0.060350529100529106, 0.06043796829076458,
        0.06062619383772112, 0.061491808111864554, 0.06184344290071162,
        0.061860911812891925, 0.0626152592529056, 0.06319252077562326,
        0.0632034632034632, 0.0634451590474535, 0.06418710982150708,
        0.06438146754468485, 0.064900426742532, 0.0650942975611931,
        0.06544150605109816, 0.06736803248431156, 0.06780605610254506,
        0.06858001784959368, 0.0686638762169026, 0.06976299694189603,
        0.07151253918495298, 0.07229870258492621, 0.07305844675740593,
        0.07354422728188595, 0.07385175692992513, 0.07398773627932904,
        0.07565289484593063, 0.07680976430976431, 0.07687447346251053,
        0.07809491206298944, 0.0786502327184968, 0.07883369330453564,
        0.07942552497007942, 0.0794903903740404, 0.08070935786308155,
        0.08129538064056306, 0.08225250369397472, 0.08341188905076129,
        0.08379247015610652, 0.08677047426601688, 0.08946809379851293,
        0.0896689034731952,
      ],
      met: [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0.0077921523419153755, 0.009224859099754847,
        0.010351379711295766, 0.010673450887504751, 0.010937968234941564,
        0.011023526924586996, 0.011127709521051186, 0.012032305917257295,
        0.012152488763109705, 0.012574066418630288, 0.012646386251819,
        0.013008767552926083, 0.013264527383072284, 0.013332846288720047,
        0.013335769090244793, 0.013521523301474402, 0.013716132426440193,
        0.013860934948543652, 0.01402443710136018, 0.014079617343002624,
        0.01409592955897119, 0.014222256857855359, 0.014609934755633831,
        0.014943705220061412, 0.014957790345053686, 0.015080152040984961,
        0.01509199917304114, 0.015127025570889801, 0.015159066367638509,
        0.015173560590313863, 0.015234358696105848, 0.015239447204709615,
        0.015503546701779723, 0.015689477303988997, 0.01587923083616114,
        0.016192715496206916, 0.016209254818367526, 0.01639344262295082,
        0.016582617782018083, 0.01685522973909028, 0.017017903767251024,
        0.017048108360579167, 0.017241379310344827, 0.017290383704405495,
        0.017319098457888493, 0.01733884376039143, 0.017402498331267283,
        0.01741079946575081, 0.017422434367541765, 0.017469129893749404,
        0.017480005746851206, 0.017512714710680357, 0.017551452202346603,
        0.017663569492837785, 0.017690965490500195, 0.01777626260166561,
        0.017936999361147968, 0.018380501561083694, 0.01845764854614412,
        0.018519458115581713, 0.01853262249301853, 0.018601569666700644,
        0.018659577731199837, 0.01870068654575264, 0.01923887834703774,
        0.019290735161989325, 0.019356207243994273, 0.01938396176314392,
        0.019456289978678036, 0.019528115135626772, 0.019722267250229644,
        0.020355808376554572, 0.020362054057069538, 0.02036489426993249,
        0.020766954938552573, 0.020779960148021637, 0.02078706076655846,
        0.020968575860286092, 0.02125800815375655, 0.0214642752131726,
        0.021601467716162635, 0.021733952602119806, 0.021828837988158604,
        0.021852361851164463, 0.022009829046944252, 0.02248644652538196,
        0.02284176601270378, 0.023208494944999044, 0.023477198173281016,
        0.02349382080329557, 0.023620009059729503, 0.023719781648037435,
        0.024605635701766212, 0.024947882847476163, 0.02514640027557699,
        0.02528926765052311, 0.025516445873676116, 0.025804171085189113,
        0.02605188965418793, 0.026090064331665476, 0.026511712366079535,
        0.02703503444189319, 0.027172901544760843, 0.027690323559534196,
        0.02781164279183176, 0.028133189455834744, 0.028445622101858713,
        0.02866567187622713, 0.02877868012299929, 0.02905935273277338,
        0.02916383684231553, 0.029165001997602878, 0.02957980469224847,
        0.029648282024205993, 0.03057335511161369, 0.03066325030453228,
        0.030785234333267734, 0.031215256991362354, 0.03132375026818279,
        0.031385700159078204, 0.031426234448318914, 0.031485874487815396,
        0.03226661951909477, 0.032678275661399345, 0.032697303592224315,
        0.032865117954258956, 0.03301076241295107, 0.03340349592751899,
        0.03393559983884464, 0.03429967579758493, 0.03445238020325331,
        0.03458185952501264, 0.03544893895984073, 0.03547477889007678,
        0.03553175955220248, 0.036562671045429665, 0.03683891804602341,
        0.03698449690951464, 0.03747625648133888, 0.03756496680903618,
        0.03776513191929643, 0.037865034493490324, 0.03801885318472996,
        0.038463564992886876, 0.03958355926689079, 0.03960646724780265,
        0.03978635273599302, 0.04032258064516129, 0.04069799855048224,
        0.040929989160094195, 0.04129737884216481, 0.04254244531644586,
        0.043249861758432734, 0.043794744630644325, 0.04488992743819949,
        0.045008940131944015, 0.045335983107688486, 0.04571357004195628,
        0.04611497157296273, 0.046388477017581024, 0.046494840983397734,
        0.04712312260618841, 0.04791441042302517, 0.047980019279642454,
        0.04808176779673217,
      ],
    },
  },
  {
    benchmarks: LOOKBACK_END_DATE_STRINGS.map((endDate) => ({
      target: 0.028739974981108838,
      endDate,
    })),
    caseloadType: CASELOAD_TYPE_IDS.enum.SEX_OFFENSE,
    metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
    latestPeriodValues: {
      near: [
        0.02935971685971686, 0.03093744702491948, 0.03237250554323725,
        0.03372447565370045, 0.03479006815040747, 0.04377548572799233,
        0.05392229280543655, 0.05550486618004866, 0.06122620145936426,
      ],
      met: [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.0173108845150581,
        0.018670076726342712, 0.019819721980886187, 0.022852491860756323,
        0.02359100310237849, 0.023865568196678438, 0.024082871470044866,
        0.02499315256094221,
      ],
      far: [
        0.06633147564817059, 0.0756829609662537, 0.0843280708509819,
        0.10630035918842831, 0.11247207457052615,
      ],
    },
  },
  {
    benchmarks: LOOKBACK_END_DATE_STRINGS.map((endDate) => ({
      target: 0.21415916840761745,
      endDate,
    })),

    caseloadType: CASELOAD_TYPE_IDS.enum.SEX_OFFENSE,
    metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
    latestPeriodValues: {
      near: [
        0.2156891712217462, 0.22289320124847334, 0.2513774104683196,
        0.25765638575152044, 0.26617355974580686, 0.2842457752511487,
        0.30401465933699817, 0.30873334743074643, 0.3092029264536003,
        0.32831614295994244, 0.33674410802650345, 0.33724475653700453,
        0.35949406458970506,
      ],
      met: [
        0.018847464628730763, 0.02775243309002433, 0.06404070532502851,
        0.06958013630081494, 0.07086690612561887, 0.07159670459003531,
        0.08246723904202441, 0.08595921058829072, 0.08735192054565034,
        0.09013087496913326, 0.09335038363171355, 0.09793399517037832,
        0.108173789342659, 0.11055245941361763, 0.12117619160540669,
        0.14154601861427094, 0.14504271806079871, 0.14995891536565326,
        0.19266297176035893, 0.19395979098396954, 0.1942350332594235,
        0.19682613049842076, 0.20551801801801803,
      ],
      far: [0.383876345, 0.4331242583488727],
    },
  },
  {
    benchmarks: LOOKBACK_END_DATE_STRINGS.map((endDate) => ({
      target: 0.10847022815450755,
      endDate,
    })),

    caseloadType: CASELOAD_TYPE_IDS.enum.SEX_OFFENSE,
    metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
    latestPeriodValues: {
      near: [
        0.10943871431998081, 0.12041435735022432, 0.12374978809967792,
        0.1348979026148018, 0.14187350769059914, 0.1513659219325074,
        0.15209917699760392, 0.15306550364841065, 0.1686561417019638,
        0.17054746515068922,
      ],
      met: [
        0, 0, 0, 0, 0.021634757868531803, 0.02359100310237849,
        0.023865568196678438, 0.02499315256094221, 0.02775243309002433,
        0.030043624989711085, 0.032020352662514254, 0.041233619521012205,
        0.051575526352974424, 0.05392229280543655, 0.05871943371943372,
        0.058760397102227, 0.06465326366132318, 0.0647450110864745,
        0.06855747558226898, 0.07252135903039936, 0.07429773374949111,
        0.07718333685768661, 0.07927888792354475, 0.08435405592789462,
        0.08655442257529049, 0.08735192054565034, 0.0884419675308941,
      ],
      far: [],
    },
  },
] satisfies RawMetricBenchmark[];

export const metricBenchmarksFixture = rawMetricBenchmarksFixture.map((b) =>
  metricBenchmarkSchema.parse(b),
);