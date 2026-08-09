document.addEventListener("DOMContentLoaded", function () {

    const csInterface = new CSInterface();

    // Merkt sich, welche Effekt-Checkboxen aktuell aktiviert sind
    const effectsState = {
        // Quick Access / Direct
        transform: false,
        gaussian_blur: false,

        // Blur & Sharpen
        bokeh_blur: false,
        channel_blur: false,
        compound_blur: false,
        directional_blur: false,
        focus_blur: false,
        reduce_interlace_flicker: false,
        sharpen: false,
        unsharp_mask: false,

        // Color
        asc_cdl: false,
        brightness_contrast: false,
        lumetri: false,
        tint: false,
        video_limiter: false,
        vignette: false,

        // Distort
        corner_pin: false,
        lens_distortion: false,
        magnify: false,
        mirror: false,
        spherize: false,
        turbulent_displace: false,
        twirl: false,
        warp_stabilizer: false,
        wave_warp: false,

        // Generate
        "4-color-gradient": false,
        gradient: false,

        // Image Control
        black_white: false,
        channel_mix: false,
        color_pass: false,
        color_replace: false,
        gamma_correction: false,
        invert: false,
        rounded_crop: false,

        // Keying
        alpha_adjust: false,
        color_key: false,
        logo_cutout: false,
        luma_key: false,
        track_matte_key: false,
        ultra_key: false,

        // Stylize
        brush_strokes: false,
        color_emboss: false,
        find_edges: false,
        mosaic: false,
        posterize: false,
        roughen_edges: false,
        strobe_light: false,

        // Time
        posterize_time: false,

        // Transform & Crop
        "3d_rotate": false,
        auto_reframe: false,
        camera_shake: false,
        grow: false,
        horizontal_flip: false,
        move: false,
        offset: false,
        shrink: false,
        spacer: false,
        spin: false,
        vertical_flip: false,
        wiggle: false
    };

    // Anzeige-Labels der Effekte (werden auch für den dynamischen Menütitel verwendet)
    const effectLabels = {
        // Quick Access / Direct
        transform: "Transform",
        gaussian_blur: "Gaussian Blur",

        // Blur & Sharpen
        bokeh_blur: "Bokeh Blur",
        channel_blur: "Channel Blur",
        compound_blur: "Compound Blur",
        directional_blur: "Directional Blur",
        focus_blur: "Focus Blur",
        reduce_interlace_flicker: "Reduce Interlace Flicker",
        sharpen: "Sharpen",
        unsharp_mask: "Unsharp Mask",

        // Color
        asc_cdl: "ASC CDL",
        brightness_contrast: "Brightness && Contrast",
        lumetri: "Lumetri Color",
        tint: "Tint",
        video_limiter: "Video Limiter",
        vignette: "Vignette",

        // Distort
        corner_pin: "Corner Pin",
        lens_distortion: "Lens Distortion",
        magnify: "Magnify",
        mirror: "Mirror",
        spherize: "Spherize",
        turbulent_displace: "Turbulent Displace",
        twirl: "Twirl",
        warp_stabilizer: "Warp Stabilizer",
        wave_warp: "Wave Warp",

        // Generate
        "4-color-gradient": "4-Color Gradient",
        gradient: "Gradient",

        // Image Control
        black_white: "Black && White",
        channel_mix: "Channel Mix",
        color_pass: "Color Pass",
        color_replace: "Color Replace",
        gamma_correction: "Gamma Correction",
        invert: "Invert",
        rounded_crop: "Rounded Crop",

        // Keying
        alpha_adjust: "Alpha Adjust",
        color_key: "Color Key",
        logo_cutout: "Logo Cutout",
        luma_key: "Luma Key",
        track_matte_key: "Track Matte Key",
        ultra_key: "Ultra Key",

        // Stylize
        brush_strokes: "Brush Strokes",
        color_emboss: "Color Emboss",
        find_edges: "Find Edges",
        mosaic: "Mosaic",
        posterize: "Posterize",
        roughen_edges: "Roughen Edges",
        strobe_light: "Strobe Light",

        // Time
        posterize_time: "Posterize Time",

        // Transform & Crop
        "3d_rotate": "3D Rotate",
        auto_reframe: "Auto Reframe",
        camera_shake: "Camera Shake",
        grow: "Grow",
        horizontal_flip: "Horizontal Flip",
        move: "Move",
        offset: "Offset",
        shrink: "Shrink",
        spacer: "Spacer",
        spin: "Spin",
        vertical_flip: "Vertical Flip",
        wiggle: "Wiggle"
    };

    // Reihenfolge der Quick-Access-Einträge (direkt unter "None")
    const quickAccessIds = ["transform", "gaussian_blur"];

    // Untermenü-Gruppen: Id, sichtbares Label, enthaltene Effekt-Ids
    const effectGroups = [
        { id: "blur_sharpen", label: "Blur & Sharpen", items: ["bokeh_blur", "channel_blur", "compound_blur", "directional_blur", "focus_blur", "gaussian_blur", "reduce_interlace_flicker", "sharpen", "unsharp_mask"] },
        { id: "color", label: "Color", items: ["asc_cdl", "brightness_contrast", "lumetri", "tint", "video_limiter", "vignette"] },
        { id: "distort", label: "Distort", items: ["corner_pin", "lens_distortion", "magnify", "mirror", "spherize", "turbulent_displace", "twirl", "warp_stabilizer", "wave_warp"] },
        { id: "generate", label: "Generate", items: ["4-color-gradient", "gradient"] },
        { id: "image_control", label: "Image Control", items: ["black_white", "channel_mix", "color_pass", "color_replace", "gamma_correction", "invert", "rounded_crop"] },
        { id: "keying", label: "Keying", items: ["alpha_adjust", "color_key", "logo_cutout", "luma_key", "track_matte_key", "ultra_key"] },
        { id: "stylize", label: "Stylize", items: ["brush_strokes", "color_emboss", "find_edges", "mosaic", "posterize", "roughen_edges", "strobe_light"] },
        { id: "time", label: "Time", items: ["posterize_time"] },
        { id: "transform_crop", label: "Transform & Crop", items: ["3d_rotate", "auto_reframe", "camera_shake", "grow", "horizontal_flip", "move", "offset", "shrink", "spacer", "spin", "transform", "vertical_flip", "wiggle"] }
    ];

    // "&" muss in der Menü-XML als Entity geschrieben werden
    function escapeXml(text) {
        return text.replace(/&/g, "&amp;");
    }

    // Baut ein einzelnes checkbares MenuItem-XML für einen Effekt
    function buildMenuItem(id) {
        return `<MenuItem Id="${id}" Label="${escapeXml(effectLabels[id])}" Checkable="true" Checked="${effectsState[id]}"/>`;
    }

    let userPresetsTree = null; // zuletzt geladener Preset-Baum
    let presetLookup = {};      // Menü-Id -> Preset-Objekt (name + path)
    let presetIdCounter = 0;
    let activeUserPreset = null;

    // Feste Frame-Werte für das Default-Length-Menü
    const defaultLengthOptions = [1, 2, 3, 4, 6, 8, 10, 15, 25, 50];

    // NEU: Lade den gespeicherten Wert aus dem localStorage.
    let storedFrames = localStorage.getItem("defaultFrames");

    // Wenn etwas gefunden wurde, wandle es in eine Zahl um, ansonsten nimm 15.
    let defaultFrames = storedFrames !== null ? parseInt(storedFrames, 10) : 15;

    // Sicherheitscheck: Falls der gespeicherte Wert ungültig (NaN) oder <= 0 ist, auf 15 zurücksetzen.
    if (isNaN(defaultFrames) || defaultFrames <= 0) {
        defaultFrames = 15;
    }

    // NEU: Speichert den Status des vertikalen Layouts
    let isVerticalMenu = localStorage.getItem("isVerticalMenu") === "true";
    // Layout direkt im DOM umschalten (kein CSS nötig!)
    const container = document.querySelector('.container');
    if (container) {
        container.style.flexDirection = isVerticalMenu ? "column" : "row";
    }

    function escapeForExtendScriptString(str) {
        return String(str).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    }

    function loadUserPresets(callback) {
        csInterface.evalScript("getUserPresetsXml()", (xmlString) => {
            userPresetsTree = parseUserPresetsXml(xmlString);
            if (userPresetsTree) {

            } else {
                alert("[Debug] No presets tree detected (userPresetsTree is null)");
            }

            if (typeof callback === "function") callback();
        });
    }

    function countPresets(node) {
        let count = 0;
        node.children.forEach((child) => {
            if (child.type === "preset") {
                count++;
            } else {
                count += countPresets(child);
            }
        });
        return count;
    }

    function firstChildTag(el, tagName) {
        if (!el) return null;
        for (let i = 0; i < el.children.length; i++) {
            if (el.children[i].tagName === tagName) return el.children[i];
        }
        return null;
    }

    function childTags(el, tagName) {
        const result = [];
        if (!el) return result;
        for (let i = 0; i < el.children.length; i++) {
            if (el.children[i].tagName === tagName) result.push(el.children[i]);
        }
        return result;
    }

    function getPresetElementName(el) {
        const base = firstChildTag(el, "TreeItemBase");
        const nameEl = firstChildTag(base, "Name");
        return nameEl ? nameEl.textContent : "Unbenannt";
    }

    function isRootPresetsBin(el) {
        const base = firstChildTag(el, "TreeItemBase");
        const node = firstChildTag(base, "Node");
        const props = firstChildTag(node, "Properties");
        const flag = childTags(props, "HandlerEffects.EffectItemTree.PresetsBin")[0];
        if (flag && flag.textContent === "1") return true;
        const nameEl = firstChildTag(base, "Name");
        return !!nameEl && nameEl.textContent === "Presets";
    }

    function parseUserPresetsXml(xmlString) {
        if (!xmlString) {
            alert("[Debug] No XML data received (empty string) - file was probably not found");
            return null;
        }

        let doc;
        try {
            doc = new DOMParser().parseFromString(xmlString, "text/xml");
        } catch (e) {
            alert("[Debug] DOMParser error: " + e.message);
            return null;
        }
        if (!doc || doc.getElementsByTagName("parsererror").length > 0) {
            const errText = doc ? doc.getElementsByTagName("parsererror")[0].textContent : "unknown";
            alert("[Debug] XML parser error:\n" + errText);
            return null;
        }

        const byId = {};
        Array.from(doc.querySelectorAll("[ObjectID]")).forEach((el) => {
            byId[el.getAttribute("ObjectID")] = el;
        });

        const treeEl = Array.from(doc.getElementsByTagName("Tree")).find((el) => el.hasAttribute("ObjectID"));
        const rootBinRef = treeEl && firstChildTag(treeEl, "RootBin");
        const rootBinEl = rootBinRef ? byId[rootBinRef.getAttribute("ObjectRef")] : null;

        if (!rootBinEl) {
            alert("[Debug] Root bin could not be determined");
            return null;
        }

        const rootItems = firstChildTag(rootBinEl, "Items");
        const presetsBins = [];
        childTags(rootItems, "Item").forEach((itemRef) => {
            const el = byId[itemRef.getAttribute("ObjectRef")];
            if (el && el.tagName === "BinTreeItem" && isRootPresetsBin(el)) {
                presetsBins.push(el);
            }
        });

        if (presetsBins.length === 0) {
            return null;
        }

        const root = { type: "bin", name: "User-Presets", children: [] };
        presetsBins.forEach((binEl) => {
            root.children.push(walkPresetBin(binEl, byId));
        });

        return root;
    }

    function walkPresetBin(binEl, byId, parentPath) {
        const name = getPresetElementName(binEl);
        const path = parentPath ? parentPath + "/" + name : name;
        const node = { type: "bin", name: name, path: path, children: [] };
        const items = firstChildTag(binEl, "Items");

        childTags(items, "Item").forEach((itemRef) => {
            const el = byId[itemRef.getAttribute("ObjectRef")];
            if (!el) return;

            if (el.tagName === "BinTreeItem") {
                node.children.push(walkPresetBin(el, byId, path));
            } else if (el.tagName === "TreeItem") {
                const presetName = getPresetElementName(el);
                node.children.push({ type: "preset", name: presetName, path: path + "/" + presetName });
            }
        });

        return node;
    }

    function buildPresetTreeXml(node) {
        let xml = "";
        node.children.forEach((child) => {
            if (child.type === "bin") {
                const inner = buildPresetTreeXml(child);
                if (inner) {
                    xml += `<MenuItem Id="preset_bin_${presetIdCounter++}" Label="${escapeXml(child.name)}">${inner}</MenuItem>`;
                }
            } else {
                const id = "user_preset_" + (presetIdCounter++);
                presetLookup[id] = child;
                const isChecked = !!(activeUserPreset && activeUserPreset.path === child.path);
                xml += `<MenuItem Id="${id}" Label="${escapeXml(child.name)}" Checkable="true" Checked="${isChecked}"/>`;
            }
        });
        return xml;
    }

    function buildUserPresetsMenuXml() {
        presetLookup = {};
        presetIdCounter = 0;

        let itemsXml = '<MenuItem Id="refresh_user_presets" Label="Refresh"/>';
        itemsXml += '<MenuItem Label="---" />';
        itemsXml += (userPresetsTree ? buildPresetTreeXml(userPresetsTree) : "")
            || '<MenuItem Label="Keine User-Presets gefunden" Enabled="false"/>';

        return `<MenuItem Id="user_presets" Label="User-Presets">${itemsXml}</MenuItem>`;
    }

    function buildDefaultLengthMenuXml() {
        let itemsXml = defaultLengthOptions.map((frames) => {
            const id = `default_length_${frames}`;
            const label = frames + (frames === 1 ? " Frame" : " Frames");
            const checked = defaultFrames === frames;
            return `<MenuItem Id="${id}" Label="${label}" Checkable="true" Checked="${checked}"/>`;
        }).join("");

        itemsXml += '<MenuItem Label="---" />';
        itemsXml += '<MenuItem Id="default_length_custom" Label="Custom..."/>';

        return itemsXml;
    }

    function buildFlyoutMenuXml() {
        const activeLabels = Object.keys(effectsState)
            .filter((id) => effectsState[id])
            .map((id) => effectLabels[id]);

        if (activeUserPreset) {
            activeLabels.push(activeUserPreset.name);
        }

        const topLabel = "Adjustment Effect: " + (activeLabels.length > 0 ? activeLabels.join(", ") : "None");
        const noneChecked = activeLabels.length === 0;

        // Den Titel für das Frame-Menü dynamisch generieren
        const framesMenuLabel = "Default Length: " + defaultFrames + (defaultFrames === 1 ? " Frame" : " Frames");

        let xml = "<Menu>";
        
        // 1. Adjustment Effect Menü (oberste Ebene)
        xml += `<MenuItem Id="effects" Label="${escapeXml(topLabel)}">`;
        xml += `<MenuItem Id="none" Label="None" Checkable="true" Checked="${noneChecked}"/>`;
        xml += '<MenuItem Label="---" />';
        
        xml += quickAccessIds.map(buildMenuItem).join("");
        xml += '<MenuItem Label="---" />';

        effectGroups.forEach((group) => {
            xml += `<MenuItem Id="${group.id}" Label="${escapeXml(group.label)}">`;
            xml += group.items.map(buildMenuItem).join("");
            xml += "</MenuItem>";
        });

        xml += '<MenuItem Label="---" />';
        xml += buildUserPresetsMenuXml();
        xml += "</MenuItem>"; // Schließt das "Adjustment Effect" Menü

        // 2. Default Length Menü (jetzt ebenfalls auf der obersten Ebene)
        xml += `<MenuItem Id="default_length_menu" Label="${escapeXml(framesMenuLabel)}">`;
        xml += buildDefaultLengthMenuXml();
        xml += `</MenuItem>`;

        // NEU: Spiegelstrich zwischen Adjustment Effect / Default Length
        // Menü und den beiden Info-Einträgen Key Bindings / About
        xml += '<MenuItem Label="---" />';

        xml += `<MenuItem Id="vertical_layout" Label="Vertical Layout" Checkable="true" Checked="${isVerticalMenu}"/>`;

        // 3. Key Bindings (öffnet wie "About" einfach ein Alert-Fenster)
        xml += '<MenuItem Id="key_bindings" Label="Key Bindings"/>';

        // 4. About
        xml += '<MenuItem Id="about" Label="About"/>';
        
        xml += "</Menu>";

        return xml;
    }

    function refreshFlyoutMenu() {
        csInterface.setPanelFlyoutMenu(buildFlyoutMenuXml());
    }

    refreshFlyoutMenu();
    loadUserPresets(refreshFlyoutMenu);

    function getUserPresetsXmlAsync() {
        return new Promise((resolve) => {
            csInterface.evalScript("getUserPresetsXml()", (xmlString) => {
                resolve(xmlString);
            });
        });
    }

    function showFramesPrompt(defaultValue) {
        return new Promise((resolve) => {
            const overlay = document.createElement("div");
            overlay.style.cssText = `
                position: fixed; inset: 0; background: rgba(0,0,0,0.5);
                display: flex; align-items: center; justify-content: center; z-index: 9999;
            `;
            overlay.innerHTML = `
                <div style="background:#2b2b2b; padding:16px; border-radius:6px; min-width:220px;">
                    <div style="color:#eee; margin-bottom:8px;">Please enter frame count (e.g. 10):</div>
                    <input id="framesInput" type="number" min="1" style="width:100%; box-sizing:border-box; margin-bottom:10px;" />
                    <div style="text-align:right;">
                        <button id="framesCancel">Cancel</button>
                        <button id="framesOk">OK</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            const input = overlay.querySelector("#framesInput");
            input.value = defaultValue || "";
            input.focus();

            const cleanup = (result) => {
                document.body.removeChild(overlay);
                resolve(result);
            };

            overlay.querySelector("#framesOk").onclick = () => cleanup(input.value);
            overlay.querySelector("#framesCancel").onclick = () => cleanup(null);
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") cleanup(input.value);
                if (e.key === "Escape") cleanup(null);
            });
        });
    }

    function showKeyBindingsAlert() {
        return new Promise((resolve) => {
            const overlay = document.createElement("div");
            overlay.style.cssText = `
                position: fixed; inset: 0; background: rgba(0,0,0,0.6);
                display: flex; align-items: center; justify-content: center; z-index: 9999;
            `;
            
            // Das HTML für die formatierte Alert-Box
            overlay.innerHTML = `
                <div style="background:#2b2b2b; color:#eee; padding:20px; border-radius:6px; max-width:480px; max-height:85vh; overflow-y:auto; font-family:sans-serif; font-size:13px; line-height:1.5; box-shadow:0 4px 15px rgba(0,0,0,0.5); box-sizing:border-box;">
                    <div style="font-weight:bold; font-size:15px; border-bottom:1px solid #444; padding-bottom:8px; margin-bottom:12px;">Key Bindings</div>
                    
                    <div>Select one or more clips in the timeline, then click one of the two placement buttons:</div>
                    <ul style="padding-left:20px; margin-top:8px; margin-bottom:16px;">
                        <li style="margin-bottom:6px;"><b>Adjustment Layer button</b> &mdash; places an Adjustment Layer</li>
                        <li><b>Color Matte button</b> &mdash; places a Color Matte</li>
                    </ul>
                    
                    <div>Both buttons behave the same way:</div>
                    <ul style="padding-left:20px; margin-top:8px; margin-bottom:16px;">
                        <li style="margin-bottom:6px;"><b>Click</b> &mdash; places one continuous layer above the highest selected clip, spanning from the earliest start to the latest end.</li>
                        <li style="margin-bottom:6px;"><b>Shift + Click</b> &mdash; places one continuous layer per track height (adjacent segments at the same height are merged).</li>
                        <li><b>Alt + Click</b> &mdash; places short transition-length layers centered on each cut (and on overlaps between clips), using the duration set under "Default Length".</li>
                    </ul>
                    
                    <div style="margin-bottom:20px;">Whichever effects (or a single User Preset) are checked under "Adjustment Effect" are applied automatically to every layer that gets placed.</div>
                    
                    <div style="text-align:right;">
                        <button id="alertOk" style="background:#0265DC; color:#fff; border:none; padding:6px 20px; border-radius:4px; cursor:pointer; font-size:13px;">OK</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            const okBtn = overlay.querySelector("#alertOk");
            
            // Fokus auf den Button setzen, damit die Enter-Taste sofort funktioniert
            // tabindex sorgt dafür, dass das div fokussierbar ist, falls wir Events darauf abfangen wollen
            overlay.tabIndex = -1;
            okBtn.focus();

            const cleanup = () => {
                document.body.removeChild(overlay);
                resolve();
            };

            // Klick auf den OK-Button
            okBtn.onclick = () => cleanup();
            
            // Tastatursteuerung (Enter oder Escape schließen das Fenster)
            overlay.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === "Escape") cleanup();
            });
        });
    }

    csInterface.addEventListener(
        "com.adobe.csxs.events.flyoutMenuClicked",
        function (event) {
            const menuId = event.data.menuId;

            if (menuId === "none") {
                Object.keys(effectsState).forEach((id) => {
                    effectsState[id] = false;
                });
                activeUserPreset = null;
                refreshFlyoutMenu();
            } else if (menuId === "about") {
                alert("AdjFlow\nVersion 1.0.0\nBy Noah");
            } else if (menuId === "vertical_layout") {
                // Status umkehren (aus true wird false und umgekehrt)
                isVerticalMenu = !isVerticalMenu;
                
                // NEU: Den aktuellen Status im localStorage speichern
                localStorage.setItem("isVerticalMenu", isVerticalMenu);
                
                // Menü neu laden, damit der Haken (Checked) aktualisiert wird
                refreshFlyoutMenu();
                
                // Layout direkt im DOM umschalten (kein CSS nötig!)
                const container = document.querySelector('.container');
                if (container) {
                    container.style.flexDirection = isVerticalMenu ? "column" : "row";
                }
                
            } else if (menuId === "key_bindings") {
                showKeyBindingsAlert().then(() => {});
            } else if (menuId === "refresh_user_presets") {
                loadUserPresets(refreshFlyoutMenu);
            } else if (menuId === "default_length_custom") {
                showFramesPrompt(defaultFrames).then((input) => {
                    if (input !== null) {
                        const parsedFrames = parseInt(input, 10);
                        if (!isNaN(parsedFrames) && parsedFrames > 0) {
                            defaultFrames = parsedFrames;
                            
                            // NEU: Den neuen Frame-Wert dauerhaft speichern
                            localStorage.setItem("defaultFrames", defaultFrames);
                            
                            refreshFlyoutMenu();
                        } else {
                            alert("Enter valid number.");
                        }
                    }
                });
            } else if (menuId.indexOf("default_length_") === 0) {
                // fängt default_length_1, default_length_15, default_length_50 usw. ab
                const frames = parseInt(menuId.slice("default_length_".length), 10);
                if (!isNaN(frames) && frames > 0) { // Habe hier sicherheitshalber > 0 ergänzt
                    defaultFrames = frames;
                    
                    // NEU: Den neuen Frame-Wert dauerhaft speichern
                    localStorage.setItem("defaultFrames", defaultFrames);
                    
                    refreshFlyoutMenu();
                }
            } else if (presetLookup.hasOwnProperty(menuId)) {
                const clickedPreset = presetLookup[menuId];

                if (activeUserPreset && activeUserPreset.path === clickedPreset.path) {
                    activeUserPreset = null;
                } else {
                    Object.keys(effectsState).forEach((id) => {
                        effectsState[id] = false;
                    });
                    activeUserPreset = clickedPreset;
                }
                refreshFlyoutMenu();
            } else if (effectsState.hasOwnProperty(menuId)) {
                activeUserPreset = null;
                effectsState[menuId] = !effectsState[menuId];
                refreshFlyoutMenu();
            }
        }
    );

    // Button Event Listener
    document.getElementById('btn-adj').addEventListener('click', async (event) => {
        const isAltPressed = event.altKey;
        const isShiftPressed = event.shiftKey;

        const effectsString = Object.keys(effectsState)
            .filter((id) => effectsState[id])
            .join(",");

        const userPresetPath = activeUserPreset ? activeUserPreset.path : "";
        let jsonString = ""; 

        if (userPresetPath !== "") {
            const xmlString = await getUserPresetsXmlAsync();
            const presetData = extractPresetData(xmlString, userPresetPath);
            
            if (presetData) {
                jsonString = JSON.stringify(presetData);
                console.log(JSON.stringify(jsonString));
            } else {
                alert("Preset not found or invalid.");
            }
        }

        const framesArg = defaultFrames;
        csInterface.evalScript(
            `addAdjustmentLayer(${isAltPressed}, ${isShiftPressed}, "${effectsString}", ${JSON.stringify(jsonString)}, "${framesArg}")`,
            (result) => {
                if (result) {
                    console.log("ExtendScript Meldung:", result);
                }
            }
        );
    });

    // NEU: btn-square - identisch zu btn-adj, platziert aber eine Color
    // Matte statt einer Adjustment Layer (ruft im Backend addColorMatte()
    // statt addAdjustmentLayer() auf, mit denselben Argumenten).
    document.getElementById('btn-square').addEventListener('click', async (event) => {
        const isAltPressed = event.altKey;
        const isShiftPressed = event.shiftKey;

        const effectsString = Object.keys(effectsState)
            .filter((id) => effectsState[id])
            .join(",");

        const userPresetPath = activeUserPreset ? activeUserPreset.path : "";
        let jsonString = "";

        if (userPresetPath !== "") {
            const xmlString = await getUserPresetsXmlAsync();
            const presetData = extractPresetData(xmlString, userPresetPath);

            if (presetData) {
                jsonString = JSON.stringify(presetData);
                console.log(JSON.stringify(jsonString));
            } else {
                alert("Preset not found or invalid.");
            }
        }

        const framesArg = defaultFrames;
        csInterface.evalScript(
            `addColorMatte(${isAltPressed}, ${isShiftPressed}, "${effectsString}", ${JSON.stringify(jsonString)}, "${framesArg}")`,
            (result) => {
                if (result) {
                    console.log("ExtendScript Meldung:", result);
                }
            }
        );
    });

});

/**
 * Extrahiert die Daten eines Presets und gibt sie als strukturiertes Objekt zurück.
 */
function extractPresetData(xmlString, presetPath) {
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        const getById = (id) => xmlDoc.querySelector(`[ObjectID="${id}"]`);

        // 1. Stammbaum aufbauen (unverändert)
        const parentMap = {};
        const nameMap = {};
        const bins = xmlDoc.getElementsByTagName("BinTreeItem");
        const items = xmlDoc.getElementsByTagName("TreeItem");

        for (let i = 0; i < bins.length; i++) {
            const bin = bins[i];
            const id = bin.getAttribute("ObjectID");
            const nameNode = bin.querySelector("TreeItemBase > Name");
            if (nameNode) nameMap[id] = nameNode.textContent;
            const childItems = bin.querySelectorAll("Items > Item");
            for (let j = 0; j < childItems.length; j++) {
                const childRef = childItems[j].getAttribute("ObjectRef");
                parentMap[childRef] = id;
            }
        }
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const id = item.getAttribute("ObjectID");
            const nameNode = item.querySelector("TreeItemBase > Name");
            if (nameNode) nameMap[id] = nameNode.textContent;
        }

        // 2. Ziel-Preset finden (unverändert)
        const searchParts = presetPath.split("/").map(p => p.trim());
        const targetName = searchParts[searchParts.length - 1];
        let targetBase = null;
        let foundFullPath = "";

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const id = item.getAttribute("ObjectID");
            if (nameMap[id] === targetName) {
                let currentId = id;
                const pathObjNames = [];
                while (currentId) {
                    pathObjNames.unshift(nameMap[currentId]);
                    currentId = parentMap[currentId];
                }
                let matches = true;
                for (let p = 0; p < searchParts.length; p++) {
                    const expected = searchParts[searchParts.length - 1 - p];
                    const actual = pathObjNames[pathObjNames.length - 1 - p];
                    if (expected !== actual) { matches = false; break; }
                }
                if (matches) {
                    targetBase = item.querySelector("TreeItemBase");
                    foundFullPath = pathObjNames.join(" / ");
                    break;
                }
            }
        }
        if (!targetBase) return null;

        // 3. Relationale Kette bis zum FilterPresetItem verfolgen
        const dataRef = targetBase.querySelector("Data").getAttribute("ObjectRef");
        const filterPresetItem = getById(dataRef);

        // 4. NEU: ALLE FilterPreset-Referenzen einsammeln (statt nur die erste)
        const filterPresetRefs = Array.from(
            filterPresetItem.querySelectorAll("FilterPresets > FilterPreset")
        ).sort((a, b) => {
            return parseInt(a.getAttribute("Index"), 10) - parseInt(b.getAttribute("Index"), 10);
        });

        const extractedEffects = [];

        filterPresetRefs.forEach(refNode => {
            const filterPresetRef = refNode.getAttribute("ObjectRef");
            const filterPreset = getById(filterPresetRef);
            const componentRef = filterPreset.querySelector("Component").getAttribute("ObjectRef");
            const component = getById(componentRef);

            let displayName = "";
            const displayNameNode = component.querySelector("DisplayName");
            if (displayNameNode) displayName = displayNameNode.textContent;

            // NEU: AnchorInPoint des FilterPresets mitnehmen. Die Keyframe-
            // Ticks in der XML sind absolut bezogen auf den Original-Clip
            // beim Speichern des Presets (nicht auf die Ziel-Timeline) -
            // das Backend braucht diesen Referenzwert, um Keyframes beim
            // Anwenden korrekt auf die tatsaechliche Clip-Position umzurechnen.
            const anchorInPointNode = filterPreset.querySelector("AnchorInPoint");
            const anchorInPointTicks = anchorInPointNode ? anchorInPointNode.textContent : null;

            // NEU: AnchorOutPoint ebenfalls mitnehmen. Zusammen mit
            // AnchorInPoint ergibt das die Laenge des Original-Clips, auf
            // dem das Preset gespeichert wurde - das Backend braucht das,
            // um die Keyframe-Zeiten proportional auf die tatsaechliche
            // Laenge des Ziel-Clips zu skalieren (z.B. damit ein Keyframe
            // am Ende des Original-Clips auch am Ende des Ziel-Clips landet,
            // unabhaengig davon, wie lang dieser ist).
            const anchorOutPointNode = filterPreset.querySelector("AnchorOutPoint");
            const anchorOutPointTicks = anchorOutPointNode ? anchorOutPointNode.textContent : null;

            // NEU: <Type> gibt an, welcher der 3 Premiere-Preset-Modi beim
            // Speichern gewaehlt wurde (Skalieren / Ankerpunkt In-Point /
            // Ankerpunkt Out-Point) - das Backend braucht das, um Keyframes
            // je nach Modus unterschiedlich auf den Ziel-Clip zu uebertragen.
            const presetTypeNode = filterPreset.querySelector("Type");
            const presetType = presetTypeNode ? presetTypeNode.textContent : null;

            const paramsList = component.querySelectorAll("Params > Param");
            const extractedParams = [];

            // 4. Parameter sammeln
            paramsList.forEach(param => {
                const paramIndex = parseInt(param.getAttribute("Index"), 10);
                const paramRef = param.getAttribute("ObjectRef");
                const paramObj = getById(paramRef);

                if (!paramObj) return;

                // Name kann fehlen, wird dann als null mitgegeben
                const nameNode = paramObj.querySelector("Name");
                const pName = nameNode ? nameNode.textContent : null;

                const pControlNode = paramObj.querySelector("ParameterControlType");
                let controlType = pControlNode ? pControlNode.textContent : "";

                // Prüfen ob der Parameter Keyframes nutzt
                const isTimeVaryingNode = paramObj.querySelector("IsTimeVarying");
                const isTimeVarying = isTimeVaryingNode && isTimeVaryingNode.textContent === "true";

                if (isTimeVarying) {
                    // --- LOGIK FÜR KEYFRAMES ---
                    const keyframesNode = paramObj.querySelector("Keyframes");
                    let parsedKeyframes = [];

                    if (keyframesNode && keyframesNode.textContent) {
                        // Alle Keyframes am Semikolon splitten
                        const kfList = keyframesNode.textContent.split(';');

                        kfList.forEach(kfStr => {
                            if (kfStr.trim() === "") return; // Leeres Ende ignorieren

                            const kfData = kfStr.split(',');

                            // Den Wert bereinigen (z.B. "0." zu "0" oder "-360." zu "-360")
                            let rawVal = kfData[1];
                            if (rawVal && rawVal.endsWith(".")) rawVal = rawVal.slice(0, -1);

                            let kfValue;
                            if (controlType === "6") {
                                // Punkt-Parameter (Typ 6): Wert liegt als "x:y" vor
                                // (normalisierte Bruch-Koordinaten 0-1), genau wie im
                                // statischen Zweig unten. parseFloat allein wuerde am
                                // ":" abbrechen und nur den X-Anteil liefern - der
                                // Y-Anteil ginge verloren.
                                if (rawVal !== undefined && rawVal.indexOf(":") !== -1) {
                                    const parts = rawVal.split(":");
                                    kfValue = { isPoint: true, x: parseFloat(parts[0]), y: parseFloat(parts[1]) };
                                } else {
                                    kfValue = 0;
                                }
                            } else {
                                kfValue = parseFloat(rawVal);
                            }

                            parsedKeyframes.push({
                                timeTicks: kfData[0],             // Premiere Ticks als String
                                value: kfValue,                   // Der Wert des Keyframes
                                rawInterpolation: kfData.slice(2) // Bezier/Ease Daten
                            });
                        });
                    }

                    extractedParams.push({
                        index: paramIndex,
                        name: pName,
                        isKeyframed: true,
                        keyframes: parsedKeyframes
                    });

                } else {
                    // --- LOGIK FÜR STATISCHE WERTE ---
                    const pKeyframesNode = paramObj.querySelector("StartKeyframe");
                    let rawValue = null;

                    if (pKeyframesNode) {
                        const kfParts = pKeyframesNode.textContent.split(",");
                        if (kfParts.length > 1) rawValue = kfParts[1];
                    } else {
                        const pValueNode = paramObj.querySelector("CurrentValue");
                        if (pValueNode) rawValue = pValueNode.textContent;
                    }

                    let finalValue = rawValue;

                    if (controlType === "5") {
                        // Farbe (Typ 5): 64-Bit AARRGGBB entschlüsseln
                        try {
                            const bigIntColor = BigInt(rawValue);
                            const hexColor = bigIntColor.toString(16).padStart(16, '0');
                            const a = parseInt(hexColor.substring(0, 2), 16);
                            const r = parseInt(hexColor.substring(4, 6), 16);
                            const g = parseInt(hexColor.substring(8, 10), 16);
                            const b = parseInt(hexColor.substring(12, 14), 16);
                            finalValue = { isColor: true, r, g, b, a, raw: rawValue };
                        } catch (e) {
                            finalValue = 0;
                        }
                    } else if (controlType === "6") {
                        // Punkt-Parameter: "x:y" als normalisierte Bruch-Koordinaten (0-1)
                        if (rawValue !== null && rawValue.indexOf(":") !== -1) {
                            const parts = rawValue.split(":");
                            finalValue = { isPoint: true, x: parseFloat(parts[0]), y: parseFloat(parts[1]) };
                        } else {
                            finalValue = 0;
                        }
                    } else if (controlType === "4") {
                        // Checkbox (Typ 4): Boolean
                        finalValue = (rawValue === "true" || rawValue === "1");
                    } else {
                        // Alle anderen (Typ 2 Slider, Typ 7 Dropdowns): In echte Zahlen umwandeln
                        if (rawValue !== null && rawValue !== "") {
                            finalValue = parseFloat(rawValue);
                        }
                    }

                    extractedParams.push({
                        index: paramIndex,
                        name: pName,
                        isKeyframed: false,
                        value: finalValue
                    });
                }
            });

            // Sicherheitshalber nach Index sortieren, falls die XML sie nicht schon
            // in Reihenfolge liefert
            extractedParams.sort((a, b) => a.index - b.index);

            extractedEffects.push({ effectName: displayName, params: extractedParams, anchorInPointTicks, anchorOutPointTicks, presetType });
        });

        return { effects: extractedEffects };

    } catch (error) {
        console.error("Fehler bei der Extraktion: " + error.message);
        return null;
    }
}