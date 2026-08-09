// Ordnet die main.js-Effekt-Ids den tatsächlichen Effekt-Namen im Premiere
// Effekte-Panel zu. Jeder Effekt hat ein Array mit den möglichen Namen in
// der Reihenfolge [Englisch, Deutsch]. Beim Anwenden wird der erste Name
// versucht, der im Effekt-Katalog gefunden wird (siehe applyEffectsAt) -
// dadurch funktioniert das Skript unabhängig davon, ob Premiere auf
// Englisch oder Deutsch läuft. Läuft Premiere in einer weiteren Sprache,
// hier einfach einen dritten Eintrag im Array ergänzen (mit
// qe.project.getVideoEffectList() in der ExtendScript-Konsole prüfen,
// welcher Name exakt verwendet wird).
var EFFECT_NAME_MAP = {
    // Quick Access / Direct
    "transform": ["Transform", "Transformieren"],
    "gaussian_blur": ["Gaussian Blur", "Gaußscher Weichzeichner"],

    // Blur & Sharpen
    "bokeh_blur": ["Bokeh Blur", "Bokeh-Weichzeichner"],
    "channel_blur": ["Channel Blur", "Kanal-Weichzeichner"],
    "compound_blur": ["Compound Blur", "Ebenenübergreif. Weichzeichner"],
    "directional_blur": ["Directional Blur", "Richtungsunschärfe"],
    "focus_blur": ["Focus Blur", "Fokus-Weichzeichner"],
    "reduce_interlace_flicker": ["Reduce Interlace Flicker", "Halbbildflimmern reduzieren"],
    "sharpen": ["Sharpen", "Scharfzeichner"],
    "unsharp_mask": ["Unsharp Mask", "Unscharf maskieren"],

    // Color
    "asc_cdl": ["ASC CDL", "ASC CDL"],
    "brightness_contrast": ["Brightness & Contrast", "Brightness & Contrast"],
    "lumetri": ["Lumetri Color", "Lumetri-Farbe"],
    "tint": ["Tint", "Färbung"],
    "video_limiter": ["Video Limiter", "Videobegrenzer"],
    "vignette": ["Vignette", "Vignette"],

    // Distort
    "corner_pin": ["Corner Pin", "Eckpunkte verschieben"],
    "lens_distortion": ["Lens Distortion", "Linsenverzerrung"],
    "magnify": ["Magnify", "Zoomen"],
    "mirror": ["Mirror", "Spiegeln"],
    "spherize": ["Spherize", "Wölben"],
    "turbulent_displace": ["Turbulent Displace", "Turbulentes Versetzen"],
    "twirl": ["Twirl", "Strudel"],
    "warp_stabilizer": ["Warp Stabilizer", "Verkrümmungsstabilisierung"],
    "wave_warp": ["Wave Warp", "Komplexe Wellen"],

    // Generate
    "4-color-gradient": ["4-Color Gradient", "4-Farben-Verlauf"],
    "gradient": ["Gradient", "Farbverlauf"],

    // Image Control
    "black_white": ["Black & White", "Schwarz & Weiß"],
    "channel_mix": ["Channel Mix", "Kanal-Mix"],
    "color_pass": ["Color Pass", "Color Pass"],
    "color_replace": ["Color Replace", "Farbe ersetzen"],
    "gamma_correction": ["Gamma Correction", "Gamma-Korrektur"],
    "invert": ["Invert", "Umkehren"],
    "rounded_crop": ["Rounded Crop", "Abgerundeter Zuschnitt"],

    // Keying
    "alpha_adjust": ["Alpha Adjust", "Alpha-Anpassung"],
    "color_key": ["Color Key", "Color-Key"],
    "logo_cutout": ["Logo Cutout", "Logo-Freistellung"],
    "luma_key": ["Luma Key", "Luminanz-Key"],
    "track_matte_key": ["Track Matte Key", "Spurmaske-Key"],
    "ultra_key": ["Ultra Key", "Ultra-Key"],

    // Stylize
    "brush_strokes": ["Brush Strokes", "Pinselstriche"],
    "color_emboss": ["Color Emboss", "Farbrelief"],
    "find_edges": ["Find Edges", "Konturen finden"],
    "mosaic": ["Mosaic", "Mosaik"],
    "posterize": ["Posterize", "Tontrennung"],
    "roughen_edges": ["Roughen Edges", "Kanten aufrauen"],
    "strobe_light": ["Strobe Light", "Stroboskop"],

    // Time
    "posterize_time": ["Posterize Time", "Zeittrennung"],

    // Transform & Crop
    "3d_rotate": ["3D Rotate", "3D-Drehung"],
    "auto_reframe": ["Auto Reframe", "Auto Reframe"],
    "camera_shake": ["Camera Shake", "Kamerawackeln"],
    "grow": ["Grow", "Wachsen"],
    "horizontal_flip": ["Horizontal Flip", "Horizontal spiegeln"],
    "move": ["Move", "Verschieben"],
    "offset": ["Offset", "Offset"],
    "shrink": ["Shrink", "Schrumpfen"],
    "spacer": ["Spacer", "Abstand"],
    "spin": ["Spin", "Drehen"],
    "vertical_flip": ["Vertical Flip", "Vertikal spiegeln"],
    "wiggle": ["Wiggle", "Wackeln"]
};

// -----------------------------------------------------------
// qe.project.getVideoEffectByName() ist bei einem nicht passenden Namen
// nicht zuverlässig (kein garantiertes null/Exception), deshalb wird der
// Katalog hier einmal über qe.project.getVideoEffectList() eingelesen und
// die Kandidaten-Namen aus EFFECT_NAME_MAP werden dagegen geprüft, bevor
// getVideoEffectByName() überhaupt aufgerufen wird.
//
// Der Vergleich erfolgt normalisiert (Umlaute auf Basisbuchstaben
// reduziert, klein geschrieben, Sonderzeichen entfernt), da ExtendScript
// Umlaute/ß aus dem .jsx-Quelltext offenbar anders kodiert als die
// Strings, die getVideoEffectList() zur Laufzeit liefert. Verwendet wird
// danach immer der ECHTE Katalog-String, nie der getippte aus der Map.
// -----------------------------------------------------------
// =====================================================================
// hostscript.jsx (zusammengeführt)
// =====================================================================
// Diese Datei fasst zwei bisher getrennte Teile zusammen:
//
//   1) addAdjustmentLayer(...) – platziert Einstellungsebenen exakt über
//      den ausgewählten (ggf. gestapelten) Clips (Skyline-Algorithmus).
//
//   2) Die komplette Preset-Pipeline (applyCustomPreset & Helfer) – wendet
//      ein aus der Premiere-eigenen .prfpset-XML extrahiertes User-Preset
//      (inkl. statischer und keyframter Parameter) auf Clips an.
//
// NEU: addAdjustmentLayer() und addColorMatte() sind die beiden
// Einstiegspunkte für die Skyline-Buttons (btn-adj / btn-square) und
// entscheiden selbst, ob sie ein User-Preset (JSON) oder eine Reihe
// einzeln benannter Effekte auf die gerade platzierte Ebene anwenden
// sollen. Beide rufen dieselbe gemeinsame Kernfunktion
// placeLayerAndApply() auf und unterscheiden sich nur über den
// layerType-Parameter (welches Quell-Projektelement gesucht/platziert
// wird - Einstellungsebene vs. Farbfläche/Color Matte). Ansonsten ist
// die komplette Logik (Skyline-Algorithmus, Alt/Shift-Verhalten,
// Preset-/Effekt-Anwendung) identisch:
//
//   - effectsString  -> mehrere Effekte per Namen, weiterhin stapelbar
//                        (Logik unverändert: applyEffectsAt via EFFECT_NAME_MAP)
//   - presetJsonString -> genau EIN User-Preset (kann intern selbst aus
//                        mehreren Effekten inkl. Keyframes bestehen), über
//                        die neue Funktion applyPresetAt()
//
// Beides gleichzeitig ist nicht vorgesehen. Wird trotzdem beides übergeben,
// hat presetJsonString Vorrang, effectsString wird dann ignoriert.
//
// applyCustomPreset(jsonString) bleibt zusätzlich als eigenständige
// Funktion erhalten (wendet ein Preset direkt auf alle aktuell in der
// Timeline selektierten Clips an, unabhängig von Einstellungsebenen) -
// falls sie an anderer Stelle im Panel noch benutzt wird. Falls nicht
// mehr benötigt, kann sie gefahrlos entfernt werden.
//
// Hinweis: EFFECT_NAME_MAP (Zuordnung interner Effekt-Keys wie
// "gaussian_blur" zu möglichen Katalog-Namen) wird hier vorausgesetzt und
// muss weiterhin an anderer Stelle in dieser Datei definiert sein.
// =====================================================================


// ---------------------------------------------------------------------
// PRESET-DATEI-SUCHE
// Liest die Premiere-eigene "Effect Presets and Custom Items.prfpset"-XML,
// damit das Frontend (main.js) daraus User-Presets extrahieren kann.
// Bugfix: File.name liefert bei ExtendScript URI-kodierte Namen
// (Leerzeichen werden zu "%20"), deshalb schlug der reine String-Vergleich
// fehl. Fix: decodeURI() vor dem Vergleich.
// ---------------------------------------------------------------------

var debugMode = false; // setze auf false, um Alerts zu deaktivieren
function alertDebug(message) {
    if (debugMode) {
        alert(message);
    }
}

function getUserPresetsXml() {
    try {
        var base = new Folder(Folder.myDocuments.fsName + "/Adobe/Premiere Pro");
        if (!base.exists) {
            return "";
        }

        var versionFolders = base.getFiles(function (f) {
            return f instanceof Folder;
        }) || [];

        var candidates = [];
        for (var i = 0; i < versionFolders.length; i++) {
            var found = searchForPresetFile(versionFolders[i], 3);
            if (found) {
                candidates.push(found);
            }
        }

        if (candidates.length === 0) {
            return "";
        }

        // Bei mehreren installierten Versionen die zuletzt geänderte nehmen
        candidates.sort(function (a, b) {
            return b.modified.getTime() - a.modified.getTime();
        });

        var presetFile = candidates[0];
        presetFile.encoding = "UTF-8";
        presetFile.open("r");
        var content = presetFile.read();
        presetFile.close();

        return content;
    } catch (e) {
        alertDebug("[Debug] Fehler in getUserPresetsXml: " + e.toString());
        return "";
    }
}

// Rekursive Dateisuche mit begrenzter Tiefe (Performance-Schutz).
// Wichtig: entries[i].name ist URI-kodiert -> mit decodeURI() vergleichen.
function searchForPresetFile(folder, depth) {
    if (depth < 0) {
        return null;
    }

    var entries = folder.getFiles();
    if (!entries) {
        return null;
    }

    for (var i = 0; i < entries.length; i++) {
        if (entries[i] instanceof File && decodeURI(entries[i].name) === "Effect Presets and Custom Items.prfpset") {
            return entries[i];
        }
    }

    for (var j = 0; j < entries.length; j++) {
        if (entries[j] instanceof Folder) {
            var found = searchForPresetFile(entries[j], depth - 1);
            if (found) {
                return found;
            }
        }
    }

    return null;
}

function normalizeEffectName(str) {
    if (!str) return "";
    return String(str)
        .toLowerCase()
        .replace(/\uFFFD/g, "")
        .replace(/[äàáâã]/g, "a")
        .replace(/[öòóôõ]/g, "o")
        .replace(/[üùúû]/g, "u")
        .replace(/ß/g, "ss")
        .replace(/[^a-z0-9]/g, "");
}

var _videoEffectCatalog = null; // normalisierter Name -> echter Katalog-Name

function getVideoEffectCatalog() {
    if (_videoEffectCatalog) return _videoEffectCatalog;

    var catalog = {};
    try {
        var list = qe.project.getVideoEffectList();
        var count = 0;

        if (list && typeof list.numItems === "number") {
            count = list.numItems;
        } else if (list && typeof list.length === "number") {
            count = list.length;
        }

        for (var i = 0; i < count; i++) {
            var item = (list.getItemAt) ? list.getItemAt(i) : list[i];
            var name = null;

            if (typeof item === "string") {
                name = item;
            } else if (item && typeof item.name === "string") {
                name = item.name;
            }

            if (name) {
                var normalized = normalizeEffectName(name);
                if (normalized && !catalog[normalized]) {
                    catalog[normalized] = name;
                }
            }
        }
    } catch (catalogErr) {
        alertDebug("getVideoEffectCatalog: Konnte Effekt-Katalog nicht lesen: " + catalogErr);
    }

    _videoEffectCatalog = catalog;
    return catalog;
}

// ---------------------------------------------------------------------
// PRESET-ANWENDUNG – gemeinsame Bausteine
// Werden sowohl von applyCustomPreset() (alle selektierten Clips) als
// auch von der neuen applyPresetAt() (genau ein per Track+Startzeit
// identifizierter Clip, z. B. eine gerade platzierte Einstellungsebene)
// genutzt.
// ---------------------------------------------------------------------

// Liest die aktuelle Components-Liste eines Clips als Array von Namen -
// Grundlage fuer den Vorher/Nachher-Vergleich in applyFirstEffectToClip.
function getComponentNameList(clip) {
    var names = [];
    var comps = clip.components;
    for (var k = 0; k < comps.numItems; k++) {
        names.push(comps[k].displayName);
    }
    return names;
}

// Findet den Index, an dem sich zwei Namenslisten zum ersten Mal
// unterscheiden. Das ist die Position, an der ein neu hinzugefuegter
// Effekt in der components-Liste gelandet ist - unabhaengig davon, wie
// viele (auch namensgleiche!) Effekte vorher schon auf dem Clip lagen.
function findInsertedIndex(before, after) {
    var k = 0;
    while (k < before.length && k < after.length && before[k] === after[k]) {
        k++;
    }
    return k;
}

// Erster Effekt eines Presets auf einem Clip: die Einfuegeposition wird
// NICHT angenommen (z.B. clip.components.numItems, das zaehlt bereits
// vorhandene Fremd-Effekte mit und liegt dann zu hoch), sondern per
// Vorher/Nachher-Diff der components-Liste EMPIRISCH ermittelt. Das ist
// robust gegenueber (a) bereits vorhandenen Fremd-Effekten und (b)
// mehreren gleichnamigen Effekten im selben Preset (z.B. 4x
// "Schlagschatten"), weil strukturell verglichen wird statt nur der Name
// gecheckt zu werden.
// Rueckgabe: ermittelter baseIndex, oder null bei Fehler (dann wird der
// naechste Preset-Effekt erneut als "erster" behandelt).
function applyFirstEffectToClip(effectObj, track, clipIndex, qeClip, catalog) {
    var clip = track.clips[clipIndex];
    var before = getComponentNameList(clip);

    var normalizedTargetName = normalizeEffectName(effectObj.effectName);
    var realKatalogName = catalog[normalizedTargetName] || effectObj.effectName;

    var qeEffect = qe.project.getVideoEffectByName(realKatalogName);
    if (!qeEffect) {
        alertDebug("Effekt '" + realKatalogName + "' nicht gefunden, überspringe.");
        return null;
    }

    var added = qeClip.addVideoEffect(qeEffect);
    alertDebug("addVideoEffect(" + effectObj.effectName + ") [1. Effekt, empirische Positionssuche] -> " + added);

    clip = track.clips[clipIndex]; // components-Collection nach dem Add neu holen
    var after = getComponentNameList(clip);
    var baseIndex = findInsertedIndex(before, after);
    alertDebug("Empirisch ermittelter baseIndex fuer diesen Clip: " + baseIndex);

    var newComponent = clip.components[baseIndex];
    if (!newComponent || normalizeEffectName(newComponent.displayName) !== normalizedTargetName) {
        alertDebug("[Warnung] Empirisch ermittelte Position " + baseIndex + " ist '" +
            (newComponent ? newComponent.displayName : "undefined") +
            "', erwartet '" + effectObj.effectName + "'. Ueberspringe Parameter-Zuweisung fuer " +
            "diesen Effekt, baseIndex wird aber trotzdem fuer Folge-Effekte verwendet.");
        return baseIndex;
    }

    setEffectParams(newComponent, effectObj, clip);
    return baseIndex;
}

// Alle weiteren Effekte desselben Clips: baseIndex ist bereits bekannt
// (aus applyFirstEffectToClip) und wird wiederverwendet, da jeder neu
// hinzugefuegte Effekt immer an derselben fixen Position landet und
// alles Bestehende (inkl. zuvor in diesem Lauf hinzugefuegter Effekte)
// eine Position weiter schiebt.
function applyEffectToClip(effectObj, track, clipIndex, qeClip, baseIndex, catalog) {
    var normalizedTargetName = normalizeEffectName(effectObj.effectName);
    var realKatalogName = catalog[normalizedTargetName] || effectObj.effectName;

    var qeEffect = qe.project.getVideoEffectByName(realKatalogName);
    if (!qeEffect) {
        alertDebug("Effekt '" + realKatalogName + "' nicht gefunden, überspringe.");
        return;
    }

    var added = qeClip.addVideoEffect(qeEffect);
    alertDebug("addVideoEffect(" + effectObj.effectName + ") -> " + added);

    // Clip frisch holen, aber IMMER die feste baseIndex-Position lesen -
    // dort landet garantiert der zuletzt hinzugefuegte Effekt.
    var clip = track.clips[clipIndex];
    var newComponent = clip.components[baseIndex];

    if (!newComponent || normalizeEffectName(newComponent.displayName) !== normalizedTargetName) {
        alertDebug("[Warnung] Komponente an fixer Position " + baseIndex + " ist '" +
            (newComponent ? newComponent.displayName : "undefined") +
            "', erwartet '" + effectObj.effectName + "'. Ueberspringe Parameter-Zuweisung. " +
            "(Hinweis: bei mehreren gleichnamigen Effekten im Preset ist dieser Namens-Check " +
            "allein nicht aussagekraeftig - die eigentliche Absicherung ist die empirisch " +
            "ermittelte Position aus applyFirstEffectToClip.)");
        return;
    }

    setEffectParams(newComponent, effectObj, clip);
}

// Parameter-Zuweisung ausgelagert, damit applyFirstEffectToClip und
// applyEffectToClip sie identisch nutzen. Verzweigt zusaetzlich auf
// Keyframes (paramDef.isKeyframed), statt nur statische Werte zu setzen.
function setEffectParams(newComponent, effectObj, clip) {
    for (var p = 0; p < effectObj.params.length; p++) {
        var paramDef = effectObj.params[p];
        var propIdx = paramDef.index;

        if (propIdx === null || propIdx === undefined || propIdx < 0 || propIdx >= newComponent.properties.numItems) {
            alertDebug("[Warnung] Property-Index " + propIdx + " (" + (paramDef.name || "unbenannt") + ") liegt außerhalb von " + effectObj.effectName);
            continue;
        }

        var prop = newComponent.properties[propIdx];

        // Sicherheitscheck: falls ein Name vorhanden ist, sollte er zum
        // Index passen - sonst stimmen Params- und properties-Reihenfolge
        // nicht ueberein und wir wuerden den falschen Wert setzen.
        if (paramDef.name && prop.displayName && prop.displayName !== paramDef.name) {
            alertDebug("[Warnung] Index " + propIdx + " in " + effectObj.effectName +
                ": erwartet '" + paramDef.name + "', gefunden '" + prop.displayName + "'.");
        }

        if (paramDef.isKeyframed && paramDef.keyframes && paramDef.keyframes.length > 0) {
            setKeyframedParam(prop, paramDef, effectObj, clip);
        } else {
            setStaticValue(prop, paramDef.value, paramDef, effectObj);
        }
    }
}

// Statischer (nicht animierter) Wert.
function setStaticValue(prop, xmlParamValue, paramDef, effectObj) {
    try {
        if (typeof xmlParamValue === "object" && xmlParamValue !== null && xmlParamValue.isColor) {
            prop.setColorValue(xmlParamValue.a, xmlParamValue.r, xmlParamValue.g, xmlParamValue.b, true);
        } else if (typeof xmlParamValue === "object" && xmlParamValue !== null && xmlParamValue.isPoint) {
            prop.setValue([xmlParamValue.x, xmlParamValue.y], true);
        } else {
            prop.setValue(xmlParamValue, true);
        }
    } catch (setValueErr) {
        alertDebug("Konnte " + effectObj.effectName + "[" + paramDef.index + "] (" +
            (paramDef.name || "unbenannt") + ") nicht setzen: " + setValueErr);
    }
}

// Erzeugt ein Time-Objekt aus einem (bereits sequenz-absoluten) Ticks-Wert.
// Time.ticks ist laut Adobe-Scripting-Doku vom Typ String, deshalb den Wert
// als String durchreichen statt als Number zu belassen.
function makeTimeFromTicks(absoluteTicks) {
    var t = new Time();
    t.ticks = String(absoluteTicks);
    return t;
}

// Ermittelt den Anchor-Tick-Wert eines Preset-Effekts: die urspruengliche
// Clip-Start-Referenz, relativ zu der Premiere die Keyframe-Zeiten beim
// Speichern des Presets abgelegt hat (<AnchorInPoint> im <FilterPreset>-
// Knoten der XML, z.B. "914457600000000" = exakt 3600s = 1h - das ist KEINE
// echte Timeline-Position, sondern Premieres interner Referenzpunkt fuer
// gespeicherte Presets).
//
// Bevorzugt effectObj.anchorInPointTicks (muss vom Frontend beim Erzeugen
// des JSON aus genau diesem XML-Feld mitgegeben werden). Fehlt dieses Feld
// (z.B. bei aelteren JSON-Exporten), wird ersatzweise der fruehste
// Keyframe-Zeitpunkt ueber alle Keyframe-Parameter dieses Effekts als Anchor
// angenommen - das richtet zumindest den ersten Keyframe korrekt am
// Clip-Anfang aus, kann aber den urspruenglichen Versatz *innerhalb* des
// Clips verfaelschen, wenn der erste Keyframe im Original nicht exakt bei
// Clip-Start lag.
function getEffectAnchorTicks(effectObj) {
    if (effectObj.anchorInPointTicks !== undefined && effectObj.anchorInPointTicks !== null && effectObj.anchorInPointTicks !== "") {
        return Number(effectObj.anchorInPointTicks);
    }

    if (effectObj._fallbackAnchorTicks !== undefined) {
        return effectObj._fallbackAnchorTicks;
    }

    var minTicks = null;
    for (var i = 0; i < effectObj.params.length; i++) {
        var pd = effectObj.params[i];
        if (pd.isKeyframed && pd.keyframes) {
            for (var k = 0; k < pd.keyframes.length; k++) {
                var tks = Number(pd.keyframes[k].timeTicks);
                if (minTicks === null || tks < minTicks) {
                    minTicks = tks;
                }
            }
        }
    }

    if (minTicks === null) {
        minTicks = 0;
    } else {
        alertDebug("[Warnung] " + effectObj.effectName + ": kein anchorInPointTicks im JSON gefunden - " +
            "verwende fruehesten Keyframe-Zeitpunkt als Notloesungs-Anchor. Fuer den exakten " +
            "Innerhalb-Clip-Versatz bitte <AnchorInPoint> aus der XML im Frontend mit ausliefern.");
    }

    effectObj._fallbackAnchorTicks = minTicks;
    return minTicks;
}

// Ermittelt die urspruengliche Clip-Laenge, auf die sich die Preset-
// Keyframes beim Speichern bezogen haben (<AnchorOutPoint> - <AnchorInPoint>
// aus der XML). Wird gebraucht, um die Keyframe-Zeiten proportional auf die
// tatsaechliche Laenge des Ziel-Clips zu skalieren - genau das macht
// Premiere auch beim nativen "Preset anwenden" per UI/Drag&Drop, wenn der
// Ziel-Clip nicht exakt so lang ist wie der Clip, auf dem das Preset
// urspruenglich gespeichert wurde.
//
// Erwartet effectObj.anchorOutPointTicks (muss vom Frontend beim Erzeugen
// des JSON aus <AnchorOutPoint> mitgegeben werden, analog zu
// anchorInPointTicks aus <AnchorInPoint>). Fehlt dieses Feld oder ergibt
// sich keine positive Dauer, wird null zurueckgegeben und in
// setKeyframedParam auf reines Verschieben ohne Skalierung zurueckgefallen
// (bisheriges Verhalten - besser als ein Crash oder falsche Skalierung).
function getEffectPresetDurationTicks(effectObj) {
    if (effectObj.anchorOutPointTicks === undefined || effectObj.anchorOutPointTicks === null || effectObj.anchorOutPointTicks === "") {
        return null;
    }

    var anchorIn = getEffectAnchorTicks(effectObj);
    var anchorOut = Number(effectObj.anchorOutPointTicks);
    var duration = anchorOut - anchorIn;

    if (!(duration > 0)) {
        alertDebug("[Warnung] " + effectObj.effectName + ": AnchorOutPoint (" + anchorOut +
            ") liegt nicht nach AnchorInPoint (" + anchorIn + ") - keine Skalierung moeglich.");
        return null;
    }

    return duration;
}

// Premiere kennt beim Speichern von Effekt-Presets 3 Modi, wie die
// Keyframe-Zeiten beim Anwenden auf einen Ziel-Clip anderer Laenge
// uebertragen werden (Dialog "Preset speichern" -> Dropdown "Typ",
// offiziell dokumentiert unter helpx.adobe.com/premiere/.../create-effect-
// presets.html):
//   "Skalieren"                 - alle Keyframes proportional zur Ziel-
//                                  Clip-Laenge strecken/stauchen
//   "Ankerpunkt fuer In-Point"  - Abstand des ERSTEN Keyframes zum
//                                  Clip-Anfang bleibt fix, alle anderen
//                                  Keyframes relativ dazu OHNE Skalierung
//   "Ankerpunkt fuer Out-Point" - Abstand des LETZTEN Keyframes zum
//                                  Clip-Ende bleibt fix, alle anderen
//                                  Keyframes relativ dazu OHNE Skalierung
//
// Welcher Modus fuer ein Preset galt, steht beim Speichern in <Type> in der
// XML. ACHTUNG: die Zuordnung Zahl -> Modus ist NICHT offiziell dokumentiert
// und hier nur eine Vermutung (0=Skalieren, 1=Ankerpunkt In-Point,
// 2=Ankerpunkt Out-Point), gestuetzt auf ein einzelnes Online-Beispiel (ein
// Preset namens "TITLE OUT" hatte Type=2).
//
// Erwartet effectObj.presetType (muss vom Frontend aus <Type> mitgegeben
// werden). Fehlt es, wird "scale" angenommen (Premieres Standardauswahl im
// Speichern-Dialog) und eine Warnung geloggt.
function getPresetApplyMode(effectObj) {
    var typeNum = (effectObj.presetType !== undefined && effectObj.presetType !== null && effectObj.presetType !== "")
        ? Number(effectObj.presetType) : null;

    if (typeNum === 1) return "anchor-in";
    if (typeNum === 2) return "anchor-out";
    if (typeNum === 0) return "scale";

    alertDebug("[Warnung] " + effectObj.effectName + ": presetType (" + effectObj.presetType +
        ") unbekannt oder fehlt im JSON - falle zurueck auf 'scale'. Falls das Ergebnis falsch " +
        "aussieht, bitte <Type> aus der Preset-XML pruefen und Mapping in getPresetApplyMode() anpassen.");
    return "scale";
}

// Keyframed Parameter setzen. Ablauf pro Keyframe: addKey(time) ->
// setValueAtKey(time, value, updateUI) -> setInterpolationTypeAtKey(time, type, updateUI).
function setKeyframedParam(prop, paramDef, effectObj, clip) {
    if (!prop.areKeyframesSupported()) {
        alertDebug("[Warnung] " + effectObj.effectName + "." + (paramDef.name || "unbenannt") +
            " unterstuetzt laut areKeyframesSupported() keine Keyframes - setze nur den ersten Wert statisch.");
        setStaticValue(prop, paramDef.keyframes[0].value, paramDef, effectObj);
        return;
    }

    try {
        prop.setTimeVarying(true);
    } catch (tvErr) {
        alertDebug("[Warnung] setTimeVarying(true) fehlgeschlagen fuer " + effectObj.effectName + "." +
            (paramDef.name || "unbenannt") + ": " + tvErr);
        return;
    }

    // addKey()/setValueAtKey() auf einem Component-Property eines Clips
    // erwarten eine Zeit RELATIV ZUM ANFANG DES QUELLMATERIALS (nicht zu
    // clip.start, der Timeline-Position) - deshalb clip.inPoint mit
    // einberechnen (siehe getEffectAnchorTicks/clipInPointTicks unten).
    var anchorInTicks = getEffectAnchorTicks(effectObj);
    var anchorOutTicksRaw = (effectObj.anchorOutPointTicks !== undefined && effectObj.anchorOutPointTicks !== null && effectObj.anchorOutPointTicks !== "")
        ? Number(effectObj.anchorOutPointTicks) : null;
    var presetDurationTicks = getEffectPresetDurationTicks(effectObj); // AnchorOut - AnchorIn, oder null

    var clipStartTicks = Number(clip.start.ticks);
    var clipEndTicks = Number(clip.end.ticks);
    var clipDurationTicks = clipEndTicks - clipStartTicks;
    var clipInPointTicks = Number(clip.inPoint.ticks);

    alertDebug(effectObj.effectName + ": clip.start=" + clipStartTicks + " (" +
        (clipStartTicks / 254016000000).toFixed(3) + "s), clip.end=" + clipEndTicks + " (" +
        (clipEndTicks / 254016000000).toFixed(3) + "s), Clip-Dauer=" +
        (clipDurationTicks / 254016000000).toFixed(3) + "s, clip.inPoint=" + clipInPointTicks +
        " (" + (clipInPointTicks / 254016000000).toFixed(3) + "s)");

    var mode = getPresetApplyMode(effectObj);

    var scaleFactor = 1;
    if (mode === "scale") {
        if (presetDurationTicks && clipDurationTicks > 0) {
            scaleFactor = clipDurationTicks / presetDurationTicks;
        } else {
            alertDebug("[Warnung] " + effectObj.effectName + ": Modus 'scale', aber AnchorOutPoint " +
                "oder Clip-Dauer fehlt/ungueltig - verschiebe stattdessen nur (wie 'anchor-in').");
            mode = "anchor-in";
        }
    }
    if (mode === "anchor-out" && (anchorOutTicksRaw === null || clipDurationTicks <= 0)) {
        alertDebug("[Warnung] " + effectObj.effectName + ": Modus 'anchor-out', aber AnchorOutPoint " +
            "oder Clip-Dauer fehlt/ungueltig - verschiebe stattdessen relativ zum In-Point.");
        mode = "anchor-in";
    }

    for (var k = 0; k < paramDef.keyframes.length; k++) {
        var kf = paramDef.keyframes[k];
        var kfTicks = Number(kf.timeTicks);
        var rawOffsetTicks = kfTicks - anchorInTicks;
        var offsetTicks;

        if (mode === "scale") {
            offsetTicks = Math.round(rawOffsetTicks * scaleFactor);
        } else if (mode === "anchor-out") {
            offsetTicks = Math.round(clipDurationTicks - (anchorOutTicksRaw - kfTicks));
        } else {
            offsetTicks = rawOffsetTicks;
        }

        var sourceRelativeTicks = offsetTicks + clipInPointTicks;
        var t = makeTimeFromTicks(sourceRelativeTicks);

        alertDebug("Keyframe " + k + " (" + effectObj.effectName + "." +
            (paramDef.name || "unbenannt") + "): mode=" + mode + ", rawOffsetTicks=" + rawOffsetTicks +
            " -> offsetTicks=" + offsetTicks + " (+clip.inPoint=" + clipInPointTicks +
            ") -> t.ticks=" + sourceRelativeTicks + " -> " +
            (sourceRelativeTicks / 254016000000).toFixed(3) + "s relativ zum Clip-Anfang");

        try {
            prop.addKey(t);
        } catch (addErr) {
            alertDebug("[Warnung] addKey bei ticks=" + kf.timeTicks + " (" + effectObj.effectName + "." +
                (paramDef.name || "unbenannt") + ") fehlgeschlagen: " + addErr);
        }

        try {
            if (typeof kf.value === "object" && kf.value !== null && kf.value.isColor) {
                alertDebug("[Warnung] Keyframed Color-Werte werden von der Scripting-API nicht unterstuetzt " +
                    "(kein setColorValueAtKey) - ueberspringe Keyframe bei ticks=" + kf.timeTicks + " (" +
                    effectObj.effectName + "." + (paramDef.name || "unbenannt") + ").");
            } else if (typeof kf.value === "object" && kf.value !== null && kf.value.isPoint) {
                prop.setValueAtKey(t, [kf.value.x, kf.value.y], true);
            } else {
                prop.setValueAtKey(t, kf.value, true);
            }
        } catch (valErr) {
            alertDebug("[Warnung] setValueAtKey bei ticks=" + kf.timeTicks + " (" + effectObj.effectName + "." +
                (paramDef.name || "unbenannt") + ") fehlgeschlagen: " + valErr);
        }

        if (kf.rawInterpolation && kf.rawInterpolation.length > 0) {
            var interpType = parseInt(kf.rawInterpolation[0], 10);
            if (!isNaN(interpType)) {
                try {
                    prop.setInterpolationTypeAtKey(t, interpType, true);
                } catch (interpErr) {
                    alertDebug("[Warnung] setInterpolationTypeAtKey(" + interpType + ") bei ticks=" + kf.timeTicks +
                        " (" + effectObj.effectName + "." + (paramDef.name || "unbenannt") + ") fehlgeschlagen: " + interpErr);
                }
            }
        }
    }

    try {
        var actualKeys = prop.getKeys();
        var keysLog = "";
        for (var gk = 0; gk < actualKeys.length; gk++) {
            var ak = actualKeys[gk];
            keysLog += "  Key " + gk + ": ticks=" + ak.ticks + " (" + ak.seconds.toFixed(3) + "s)\n";
        }
        alertDebug("GROUND TRUTH getKeys() fuer " + effectObj.effectName + "." + (paramDef.name || "unbenannt") +
            " (clip.start=" + clipStartTicks + " / " + (clipStartTicks / 254016000000).toFixed(3) + "s):\n" + keysLog);
    } catch (getKeysErr) {
        alertDebug("[Warnung] getKeys() fehlgeschlagen fuer " + effectObj.effectName + "." +
            (paramDef.name || "unbenannt") + ": " + getKeysErr);
    }
}

// ---------------------------------------------------------------------
// applyCustomPreset(jsonString) – wendet ein Preset direkt auf ALLE
// aktuell in der Timeline selektierten Clips an (unabhängig von
// Einstellungsebenen). Bleibt als eigenständige Funktion erhalten, falls
// sie noch von anderer Stelle im Panel aufgerufen wird.
// ---------------------------------------------------------------------
function applyCustomPreset(jsonString) {
    try {
        var presetObj;
        try {
            presetObj = eval("(" + jsonString + ")");
        } catch (e) {
            alertDebug("JSON Parse Fehler: " + e.toString());
            return "JSON Parse Fehler: " + e.toString();
        }

        var seq = app.project.activeSequence;
        if (!seq) {
            alert("Please select an active sequence.");
            return "No active sequence";
        }

        app.enableQE();
        var qeSeq = qe.project.getActiveSequence();
        var catalog = getVideoEffectCatalog();
        var effectsToApply = presetObj.effects || [presetObj];

        var appliedCount = 0;
        var errors = [];

        for (var i = 0; i < seq.videoTracks.numTracks; i++) {
            var track = seq.videoTracks[i];
            var qeTrack = qeSeq.getVideoTrackAt(i);

            for (var j = 0; j < track.clips.numItems; j++) {
                var clip = track.clips[j];
                if (!clip.isSelected()) continue;

                var qeClip = null;
                var validClipCounter = 0;
                for (var idx = 0; idx < qeTrack.numItems; idx++) {
                    var qeItem = qeTrack.getItemAt(idx);
                    if (!qeItem || (qeItem.type && qeItem.type.toString() === "Empty")) continue;
                    if (validClipCounter === j) { qeClip = qeItem; break; }
                    validClipCounter++;
                }
                if (!qeClip) continue;

                var baseIndex = null;
                alertDebug("--- Clip " + j + " auf Track " + i + " ---");

                for (var e = 0; e < effectsToApply.length; e++) {
                    try {
                        if (baseIndex === null) {
                            baseIndex = applyFirstEffectToClip(effectsToApply[e], track, j, qeClip, catalog);
                        } else {
                            applyEffectToClip(effectsToApply[e], track, j, qeClip, baseIndex, catalog);
                        }
                        appliedCount++;
                    } catch (effectErr) {
                        errors.push(effectsToApply[e].effectName + ": " + effectErr.toString());
                        alertDebug("[Fehler] " + effectsToApply[e].effectName + ": " + effectErr.toString());
                    }
                }
            }
        }

        var summary = "OK, " + appliedCount + " Effekt(e) angewendet.";
        if (errors.length > 0) {
            summary += " Fehler: " + errors.join(" | ");
        }
        alertDebug(summary);
        return summary;

    } catch (fatalErr) {
        alertDebug("[FATAL] " + fatalErr.toString());
        alertDebug("Fataler Fehler in applyCustomPreset: " + fatalErr.toString());
        return "Fataler Fehler: " + fatalErr.toString();
    } finally {

    }
}

// ---------------------------------------------------------------------
// NEU: applyPresetAt(trackIndex, startSeconds, presetEffects, catalog)
// Wendet ein komplettes User-Preset (ggf. mehrere Effekte inkl. Keyframes)
// auf GENAU EINEN Clip an - nämlich den Adjustment-Layer-Clip, der gerade
// von placeAdjustmentLayer() an trackIndex/startSeconds platziert wurde.
//
// Nutzt zur Clip-Zuordnung denselben Standard-DOM/QE-DOM-Mapping-Trick wie
// applyEffectsAt() weiter unten (Suche über die Startzeit im Standard-DOM,
// danach Abzählen der "echten" Clips im QE-DOM), wendet die Effekte dann
// aber über die Preset-Pipeline (applyFirstEffectToClip / applyEffectToClip
// / setEffectParams inkl. Keyframe-Handling) an statt nur einen einzelnen
// Effekt per Name hinzuzufügen.
// ---------------------------------------------------------------------
function applyPresetAt(trackIndex, startSeconds, presetEffects, catalog) {
    if (!presetEffects || presetEffects.length === 0) return;

    var stdTrack = app.project.activeSequence.videoTracks[trackIndex];
    var qeTrack = qe.project.getActiveSequence().getVideoTrackAt(trackIndex);

    if (!stdTrack || !qeTrack) {
        alertDebug("applyPresetAt: Spur " + trackIndex + " konnte nicht gefunden werden.");
        return;
    }

    // 1. Clip im Standard-DOM über die Zeit finden, um seinen echten Index zu ermitteln
    var targetClipIndex = -1;
    for (var c = 0; c < stdTrack.clips.numItems; c++) {
        var stdClip = stdTrack.clips[c];
        if (Math.abs(stdClip.start.seconds - startSeconds) < 0.05) {
            targetClipIndex = c;
            break;
        }
    }

    if (targetClipIndex === -1) {
        alertDebug("applyPresetAt: Konnte platzierten Clip im Standard-DOM nicht finden (Start " + startSeconds + "s)");
        return;
    }

    // 2. Im QE-DOM iterieren und NUR echte Clips zählen, bis wir den Index erreichen
    var qeClip = null;
    var validClipCounter = 0;
    for (var idx = 0; idx < qeTrack.numItems; idx++) {
        var qeItem = qeTrack.getItemAt(idx);
        if (!qeItem || (qeItem.type && qeItem.type.toString() === "Empty")) {
            continue;
        }
        if (validClipCounter === targetClipIndex) {
            qeClip = qeItem;
            break;
        }
        validClipCounter++;
    }

    if (!qeClip) {
        alertDebug("applyPresetAt: Konnte platzierten Clip im QE-DOM nicht mappen (Spur " + trackIndex + ", Start " + startSeconds + "s)");
        return;
    }

    // 3. Preset-Effekte in Original-Reihenfolge anwenden (wie applyCustomPreset,
    // aber nur für diesen einen Clip). baseIndex wird beim ersten Effekt
    // empirisch ermittelt und danach für alle weiteren Effekte dieses
    // Presets wiederverwendet.
    var baseIndex = null;
    alertDebug("--- Preset auf Adjustment-Layer (Spur " + trackIndex + ", Start " + startSeconds + "s) ---");

    for (var e = 0; e < presetEffects.length; e++) {
        try {
            if (baseIndex === null) {
                baseIndex = applyFirstEffectToClip(presetEffects[e], stdTrack, targetClipIndex, qeClip, catalog);
            } else {
                applyEffectToClip(presetEffects[e], stdTrack, targetClipIndex, qeClip, baseIndex, catalog);
            }
        } catch (effectErr) {
            alertDebug("[Fehler] " + presetEffects[e].effectName + ": " + effectErr.toString());
        }
    }
}

// ---------------------------------------------------------------------
// Kleiner Helfer: CEP übergibt Argumente aus evalScript() manchmal als
// Strings "undefined"/"null" statt als echtes undefined/null - hier
// zentral abgefangen, damit presetJsonString/effectsString sauber als
// "nicht gesetzt" erkannt werden.
// ---------------------------------------------------------------------
function isEmptyArg(v) {
    return !v || v === "undefined" || v === "null";
}

// =====================================================================
// EINSTIEGSPUNKTE: addAdjustmentLayer / addColorMatte
// Dünne Wrapper, die nur festlegen, welches Quell-Projektelement die
// gemeinsame Kernfunktion placeLayerAndApply() platzieren soll.
// =====================================================================
function addAdjustmentLayer(isAlt, isShift, effectsString, presetJsonString, customFrames) {
    return placeLayerAndApply(isAlt, isShift, effectsString, presetJsonString, customFrames, "adjustment");
}

// NEU: Zweiter Einstiegspunkt für btn-square - platziert eine Farbfläche
// (Color Matte) anstatt einer Einstellungsebene. Funktional identisch zu
// addAdjustmentLayer, nur mit anderem Quell-Projektelement.
function addColorMatte(isAlt, isShift, effectsString, presetJsonString, customFrames) {
    return placeLayerAndApply(isAlt, isShift, effectsString, presetJsonString, customFrames, "colormatte");
}

// =====================================================================
// GEMEINSAME KERNFUNKTION (vormals addAdjustmentLayer)
// Platziert die Ebene (Einstellungsebene ODER Farbfläche, je nach
// layerType) über den ausgewählten Clips (Skyline-Algorithmus) und wendet
// darauf - je nach übergebenem Argument - entweder ein einzelnes
// User-Preset ODER eine Reihe einzeln benannter Effekte an.
// =====================================================================
function placeLayerAndApply(isAlt, isShift, effectsString, presetJsonString, customFrames, layerType) {
    var seq = app.project.activeSequence;
    if (!seq) {
        alert("Please select an active sequence.");
        return;
    }
    // 1 Sekunde = 254016000000 Ticks in Premiere Pro
    var TICKS_PER_SECOND = 254016000000;

    // seq.timebase liefert die Dauer EINES Frames in Ticks als String
    // (z.B. "10160640000") - sequenzabhängig statt einer hartcodierten
    // fps-Annahme, damit es auch bei 24/25/60fps-Projekten korrekt bleibt.
    var TICKS_PER_FRAME = parseInt(seq.timebase, 10);

    // seq.timebase liefert die Dauer EINES Frames in Ticks als String (z.B. "10160640000")
    // Das teilen wir durch die Ticks pro Sekunde, um die korrekte Dauer in Sekunden zu erhalten
    var frameDurationSeconds = parseInt(seq.timebase, 10) / TICKS_PER_SECOND;
    // CEP übergibt Zahlen manchmal als String -> sauber und robust als Number() parsen
    var framesCount = Number(customFrames);
    framesCount = Math.round(framesCount); // Vorsichtshalber runden

    if (isNaN(framesCount) || framesCount <= 0) {
        framesCount = 15; // Fallback, falls nichts Sinnvolles übergeben wurde
    }

    var transitionDurationSeconds = framesCount * frameDurationSeconds;

    // Wandelt einen Sekunden-Float in ein exakt auf den nächsten Frame
    // ausgerichtetes Time-Objekt um (über Ticks statt über .seconds), damit
    // zwei direkt aneinandergrenzende Aufrufe (z.B. Ende von Segment A und
    // Start von Segment B) wirklich auf demselben Frame landen. Nutzt
    // TICKS_PER_FRAME aus seq.timebase statt einer festen fps-Annahme.
    function secondsToFrameAlignedTime(seconds) {
        var frameIndex = Math.round((seconds * TICKS_PER_SECOND) / TICKS_PER_FRAME);
        var t = new Time();
        t.ticks = Math.round(frameIndex * TICKS_PER_FRAME).toString();
        return t;
    }

    var selectedClipsData = [];

    // -----------------------------------------------------------------
    // MODUS BESTIMMEN: entweder EIN User-Preset (JSON-String, kann intern
    // mehrere Effekte inkl. Keyframes enthalten) ODER eine Reihe einzeln
    // ausgewählter Effekte per Name (effectsString, weiterhin stapelbar
    // wie bisher). Beides gleichzeitig ist nicht vorgesehen - wird
    // trotzdem beides übergeben, hat das Preset Vorrang und effectsString 
    // wird ignoriert.
    // -----------------------------------------------------------------
    var presetEffects = null; // Array von Effekt-Objekten aus dem Preset-JSON
    var presetCatalog = null;

    if (!isEmptyArg(presetJsonString)) {
        try {
            var presetObj = eval("(" + presetJsonString + ")");
            presetEffects = presetObj.effects || [presetObj];
        } catch (parseErr) {
            alertDebug("JSON Parse Fehler im Preset: " + parseErr.toString());
            return;
        }
    }

    // Aktivierte Effekte aus dem effectsString parsen (z. B. "gaussian_blur,transform")
    // - wird ignoriert, sobald ein Preset übergeben wurde.
    var effectsToApply = [];
    if (!presetEffects && !isEmptyArg(effectsString)) {
        var rawParts = effectsString.split(",");
        for (var p = 0; p < rawParts.length; p++) {
            var trimmed = rawParts[p].replace(/^\s+|\s+$/g, "");
            if (trimmed.length > 0) {
                effectsToApply.push(trimmed);
            }
        }
    }

    // Der QE-DOM wird nur gebraucht, wenn tatsächlich Effekte oder ein
    // Preset angewendet werden sollen
    if (effectsToApply.length > 0 || presetEffects) {
        app.enableQE();
    }

    if (presetEffects) {
        presetCatalog = getVideoEffectCatalog();
    }

    // 1. Clips und deren Spur-Index sammeln
    for (var i = 0; i < seq.videoTracks.numTracks; i++) {
        var track = seq.videoTracks[i];
        for (var j = 0; j < track.clips.numItems; j++) {
            var clip = track.clips[j];
            if (clip.isSelected()) {
                selectedClipsData.push({
                    clip: clip,
                    trackIndex: i,
                    start: clip.start.seconds,
                    end: clip.end.seconds
                });
            }
        }
    }

    if (selectedClipsData.length === 0) {
        alert("Please select at least one clip in the timeline.");
        return;
    }

    // 2. EINSTELLUNGSEBENE FINDEN ODER IMPORTIEREN
    var proj = app.project;
    var adjLayerItem = null;
    
    // Je nach layerType wird nach unterschiedlichen Projektelement-Namen
    // gesucht (Einstellungsebene vs. Farbfläche/Color Matte) - der Rest
    // der Funktion behandelt das gefundene Element danach völlig gleich.
    var sourceNames = (layerType === "colormatte")
        ? ["Color Matte", "Farbfläche"]
        : ["Adjustment Layer", "Einstellungsebene"];
    var sourceTemplateMarker = (layerType === "colormatte") ? "ColorMatteTemplate" : "AdjustmentLayerTemplate";
    var sourceLabel = (layerType === "colormatte") ? "Farbfläche (Color Matte)" : "Einstellungsebene";

    function findLayer() {
        for (var k = 0; k < proj.rootItem.children.numItems; k++) {
            var item = proj.rootItem.children[k];
            if (sourceNames.indexOf(item.name) !== -1 || item.name.indexOf(sourceTemplateMarker) !== -1) {
                return item;
            }
        }
        return null;
    }

    adjLayerItem = findLayer();

    if (!adjLayerItem) {
        alert("No " + sourceLabel + " found!\n\nPlease create a " + sourceLabel + " once in the Project panel (Right-click -> New Item -> " + sourceLabel + ") and run the command again.");
        return;
    }

    if (adjLayerItem.type === 2) { 
        for (var b = 0; b < adjLayerItem.children.numItems; b++) {
            if (adjLayerItem.children[b].type === 1) { 
                adjLayerItem = adjLayerItem.children[b];
                break;
            }
        }
    }

    // -----------------------------------------------------------
    // Sucht den gerade platzierten Clip über einen Index-Abgleich
    // zwischen dem offiziellen DOM und dem (inoffiziellen) QE-DOM
    // und wendet dort die ausgewählten (einzeln benannten) Effekte an.
    // Wird nur im Effekte-Modus benutzt (effectsToApply.length > 0).
    // -----------------------------------------------------------
    function applyEffectsAt(trackIndex, startSeconds) {
        if (effectsToApply.length === 0) return;

        var stdTrack = app.project.activeSequence.videoTracks[trackIndex];
        var qeTrack = qe.project.getActiveSequence().getVideoTrackAt(trackIndex);
        
        if (!stdTrack || !qeTrack) {
            $.writeln("applyEffectsAt: Spur " + trackIndex + " konnte nicht gefunden werden.");
            return;
        }

        // 1. Clip im Standard-DOM über die Zeit finden, um seinen echten Index zu ermitteln
        var targetClipIndex = -1;
        for (var c = 0; c < stdTrack.clips.numItems; c++) {
            var stdClip = stdTrack.clips[c];
            // Standard-DOM hat saubere Time-Objekte
            if (Math.abs(stdClip.start.seconds - startSeconds) < 0.05) {
                targetClipIndex = c;
                break;
            }
        }

        if (targetClipIndex === -1) {
            $.writeln("applyEffectsAt: Konnte platzierten Clip im Standard-DOM nicht finden (Start " + startSeconds + "s)");
            return;
        }

        // 2. Im QE-DOM iterieren und NUR echte Clips zählen, bis wir den Index erreichen
        var qeClip = null;
        var validClipCounter = 0;

        for (var idx = 0; idx < qeTrack.numItems; idx++) {
            var qeItem = qeTrack.getItemAt(idx);
            
            // Leere Lücken ("Empty") im QE-DOM ignorieren
            if (!qeItem || (qeItem.type && qeItem.type.toString() === "Empty")) {
                continue;
            }
            
            // Sobald unser Zähler für echte Clips dem Standard-DOM-Index entspricht, haben wir einen Match
            if (validClipCounter === targetClipIndex) {
                qeClip = qeItem;
                break;
            }
            
            validClipCounter++;
        }

        if (!qeClip) {
            $.writeln("applyEffectsAt: Konnte platzierten Clip im QE-DOM nicht mappen (Spur " + trackIndex + ", Start " + startSeconds + "s)");
            return;
        }

        // 3. Ausgewählte Effekte auf das gemappte QE-Item anwenden.
        // getVideoEffectByName() liefert bei einem falschen Namen offenbar
        // trotzdem ein truthy Ergebnis (kein null, keine Exception) - daher
        // wird hier NICHT blind der erste Name aus effectNames durchprobiert.
        // Stattdessen wird zuerst der echte, aktuell geladene Katalog
        // (getVideoEffectCatalog()) geprüft - normalisiert, um Encoding-
        // Unterschiede bei Umlauten zu umgehen - und nur der dabei gefundene
        // ECHTE Katalog-Name an getVideoEffectByName() übergeben.
        var catalog = getVideoEffectCatalog();

        for (var e = 0; e < effectsToApply.length; e++) {
            var effectNames = EFFECT_NAME_MAP[effectsToApply[e]];
            if (!effectNames) continue;

            var matchedName = null;
            for (var ln = 0; ln < effectNames.length; ln++) {
                var realName = catalog[normalizeEffectName(effectNames[ln])];
                if (realName) {
                    matchedName = realName;
                    break;
                }
            }

            if (!matchedName) {
                $.writeln("applyEffectsAt: Effekt '" + effectsToApply[e] + "' wurde unter keinem der bekannten Namen (" + effectNames.join(" / ") + ") im aktuellen Effekt-Katalog gefunden.");
                continue;
            }

            try {
                var qeEffect = qe.project.getVideoEffectByName(matchedName);
                if (qeEffect) {
                    qeClip.addVideoEffect(qeEffect);
                } else {
                    $.writeln("applyEffectsAt: '" + matchedName + "' war im Katalog gelistet, getVideoEffectByName() lieferte aber kein Ergebnis.");
                }
            } catch (addErr) {
                $.writeln("applyEffectsAt: Effekt '" + matchedName + "' konnte nicht hinzugefügt werden: " + addErr);
            }
        }
    }

    // -----------------------------------------------------------
    // Platziert die Ebene (adjLayerItem - je nach layerType eine
    // Einstellungsebene oder eine Farbfläche) an einer Stelle in der
    // passenden Länge und wendet danach - je nach Modus - entweder das
    // Preset oder die einzeln ausgewählten Effekte darauf an.
    // -----------------------------------------------------------
    function placeAdjustmentLayer(trackIndex, startSeconds, endSeconds) {
        if (trackIndex >= seq.videoTracks.numTracks) return;

        var targetTrack = seq.videoTracks[trackIndex];

        var stTime = secondsToFrameAlignedTime(startSeconds);
        var enTime = secondsToFrameAlignedTime(endSeconds);

        // --- DER ULTIMATIVE BUGFIX: Der 1-Frame Anchor Trick ---
        // NTSC-Rundungsfehler bei 29.97/59.94 umgehen wir, indem wir das 
        // Source-Item im Projektfenster immer bei 0 starten lassen und 
        // ihm die Länge von exakt einem Frame geben.
        
        var zeroTime = new Time(); 
        zeroTime.ticks = "0";
        
        var oneFrameTime = new Time(); 
        oneFrameTime.ticks = TICKS_PER_FRAME.toString();

        // Das Item im Bin ist jetzt exakt 1 Frame lang
        adjLayerItem.setInPoint(zeroTime, 1);
        adjLayerItem.setOutPoint(oneFrameTime, 1);

        $.sleep(40);

        // Wir fügen den nur 1 Frame kurzen Clip per overwriteClip ein.
        // Das ist 100% ungefährlich für den Nachbarclip, da der Clip zu kurz
        // ist, um den nächsten Bereich überhaupt zu erreichen.
        targetTrack.overwriteClip(adjLayerItem, stTime);

        $.sleep(40);

        // Source Item für den nächsten Durchlauf sauber zurücksetzen
        adjLayerItem.setInPoint(zeroTime, 1);
        adjLayerItem.clearOutPoint();

        // --- Zerstörungsfreies Ausdehnen ---
        // Jetzt suchen wir den eingefügten, 1 Frame langen Clip in der Timeline.
        for (var pc = 0; pc < targetTrack.clips.numItems; pc++) {
            var placedClip = targetTrack.clips[pc];
            
            // Abgleich der Startzeit
            if (Math.abs(placedClip.start.seconds - startSeconds) < 0.05) {
                
                // Hier passiert die Magie: Wir ziehen den 1-Frame-Clip in der
                // Timeline auf die korrekte Endzeit. Das Verändern von .end ist
                // NICHT destruktiv. Die Ebene schmiegt sich exakt an die Kante
                // des nächsten Clips, ohne dessen Frames zu fressen.
                placedClip.end = enTime; 

                // Startzeit-Rundungskorrektur beibehalten
                var startDiff = placedClip.start.seconds - startSeconds;
                if (Math.abs(startDiff) > 0.001 && Math.abs(startDiff) < (2 * frameDurationSeconds)) {
                    placedClip.start = stTime;
                }
                break;
            }
        }

        // Effekte oder Presets anwenden
        if (presetEffects) {
            applyPresetAt(trackIndex, startSeconds, presetEffects, presetCatalog);
        } else {
            applyEffectsAt(trackIndex, startSeconds);
        }
    }

    // 3. ALLE ZEITGRENZEN (Schnitte) ERMITTELN
    var times = [];
    for (var m = 0; m < selectedClipsData.length; m++) {
        times.push(selectedClipsData[m].start);
        times.push(selectedClipsData[m].end);
    }
    
    times.sort(function(a, b) { return a - b; });
    
    var boundaries = [];
    if (times.length > 0) boundaries.push(times[0]);
    for (var n = 1; n < times.length; n++) {
        if (times[n] - boundaries[boundaries.length - 1] > 0.01) {
            boundaries.push(times[n]);
        }
    }

    // 4. TIMELINE IN SEGMENTE UNTERTEILEN
    var rawSegments = [];
    for (var bd = 0; bd < boundaries.length - 1; bd++) {
        var segStart = boundaries[bd];
        var segEnd = boundaries[bd+1];
        var midPoint = segStart + (segEnd - segStart) / 2.0; 

        var maxTrack = -1;
        for (var c = 0; c < selectedClipsData.length; c++) {
            var data = selectedClipsData[c];
            if (data.start <= midPoint && data.end >= midPoint) {
                if (data.trackIndex > maxTrack) {
                    maxTrack = data.trackIndex;
                }
            }
        }

        if (maxTrack !== -1) {
            rawSegments.push({
                start: segStart,
                end: segEnd,
                targetTrack: maxTrack + 1
            });
        }
    }

    // Hilfsvariablen für saubere Abfragen (CEP übergibt Booleans manchmal als String)
    var altPressed = (isAlt === true || isAlt === "true");
    var shiftPressed = (isShift === true || isShift === "true");

    // ---------------------------------------------------------
    // LOGIK A: ALT + KLICK (Transitions clean einfügen)
    // ---------------------------------------------------------
    if (altPressed) {
        var halfDuration = transitionDurationSeconds / 2.0;

        // Grenzen-Indizes, die bereits durch eine Überschneidungsfläche
        // "verbraucht" wurden und deshalb unten NICHT nochmal als eigener
        // harter Schnitt behandelt werden dürfen.
        var handledBoundaryIndices = {};

        // SCHRITT 1: Echte Überschneidungsflächen zuerst behandeln.
        // Ein Segment gilt als Überschneidung, wenn es komplett von
        // mindestens 2 ausgewählten Clips gleichzeitig abgedeckt wird
        // (z.B. weil eine untere Spur in den Übergang reinragt).
        // Dort kommt NUR EINE Ebene hin, mittig in der Überschneidung.
        for (var t = 0; t < rawSegments.length; t++) {
            var seg = rawSegments[t];

            var coveringClips = 0;
            for (var c = 0; c < selectedClipsData.length; c++) {
                var d = selectedClipsData[c];
                if (d.start <= seg.start + 0.01 && d.end >= seg.end - 0.01) {
                    coveringClips++;
                }
            }

            if (coveringClips >= 2) {
                var overlapMid = (seg.start + seg.end) / 2.0;
                var tStartSec = overlapMid - halfDuration;
                var tEndSec = overlapMid + halfDuration;

                if (tStartSec < 0) tStartSec = 0;

                placeAdjustmentLayer(seg.targetTrack, tStartSec, tEndSec);

                // Grenze vor und nach dieser Überschneidung sind Teil
                // dieser einen Transition - unten nicht nochmal anfassen.
                handledBoundaryIndices[t - 1] = true;
                handledBoundaryIndices[t] = true;
            }
        }

        // SCHRITT 2: Übrige, harte Schnitte (keine Überschneidung, Clips
        // stoßen direkt aneinander) wie bisher mittig auf dem Schnittpunkt
        // platzieren.
        for (var t2 = 0; t2 < rawSegments.length - 1; t2++) {
            if (handledBoundaryIndices[t2]) continue;

            var cSeg = rawSegments[t2];
            var nSeg = rawSegments[t2 + 1];

            if (Math.abs(cSeg.end - nSeg.start) < 0.01) {
                var trTrackIndex = Math.max(cSeg.targetTrack, nSeg.targetTrack);

                var cutSec = cSeg.end;
                var tStartSec2 = cutSec - halfDuration;
                var tEndSec2 = cutSec + halfDuration;

                if (tStartSec2 < 0) tStartSec2 = 0;

                placeAdjustmentLayer(trTrackIndex, tStartSec2, tEndSec2);
            }
        }
    }
    // ---------------------------------------------------------
    // LOGIK B: SHIFT + KLICK (Eine durchgehende Ebene pro Ziel-Spur-Höhe)
    // ---------------------------------------------------------
    else if (shiftPressed) {
        // Direkt benachbarte rawSegments mit identischer Ziel-Spur zu EINER
        // durchgehenden Fläche zusammenführen. So erzeugt ein Clip, der von
        // einer anderen Spur hineinragt, ohne die tatsächlich benötigte
        // Höhe zu ändern, keine unnötige zusätzliche Schnittkante mehr.
        var mergedSegments = [];
        for (var s = 0; s < rawSegments.length; s++) {
            var seg = rawSegments[s];
            var last = mergedSegments.length > 0 ? mergedSegments[mergedSegments.length - 1] : null;

            if (last && last.targetTrack === seg.targetTrack && Math.abs(last.end - seg.start) < 0.01) {
                last.end = seg.end;
            } else {
                mergedSegments.push({ start: seg.start, end: seg.end, targetTrack: seg.targetTrack });
            }
        }

        for (var ms = 0; ms < mergedSegments.length; ms++) {
            var mseg = mergedSegments[ms];
            placeAdjustmentLayer(mseg.targetTrack, mseg.start, mseg.end);
        }
    }
    // ---------------------------------------------------------
    // LOGIK C: NORMALER KLICK (Eine große durchgehende Ebene)
    // ---------------------------------------------------------
    else {
        if (selectedClipsData.length > 0) {
            var minStart = selectedClipsData[0].start;
            var maxEnd = selectedClipsData[0].end;
            var highestTrack = selectedClipsData[0].trackIndex;

            // Finde den global frühesten Start, spätesten Endpunkt und die höchste Spur
            for (var c = 1; c < selectedClipsData.length; c++) {
                var cData = selectedClipsData[c];
                if (cData.start < minStart) minStart = cData.start;
                if (cData.end > maxEnd) maxEnd = cData.end;
                if (cData.trackIndex > highestTrack) highestTrack = cData.trackIndex;
            }

            // Platziert EINE Ebene auf der Spur über dem höchsten markierten Clip,
            // vom frühesten Anfang bis zum spätesten Ende.
            placeAdjustmentLayer(highestTrack + 1, minStart, maxEnd);
        }
    }
}