# Sketch Data Populator

## Installation
1. Download the ZIP file (or clone repository)
2. Move the file ```Sketch Data Populator.sketchplugin``` into your Sketch Plugins folder. In Sketch 3, choose **Plugins › Reveal Plugins Folder…** to open it.

## Testing & Credits

Please report bugs, observations, ideas & feature requests as [issues](https://github.com/preciousforever/sketch-data-populator/issues).

We conceived _Sketch Data Populator_ to improve our design with data process at [precious design studio](http://precious-forever.com/) and developed the plugin in collaboration with [Lukas Ondrej](https://github.com/lukas77me). Please get in touch if you have questions or comments via [@preciousforever](https://twitter.com/preciousforever) or [our website](http://precious-forever.com/contact).

## How to use …
 
The **Sketch Data Populator** plugin replaces text and image {placeholders} with data: 

![Sketch Data Populator](sketch-data-populator.gif)

### Here's how it works:

1. Create a Layer Group that contains at least one Text Layer. In these Text Layers, use placeholders for you data fields in curly brackets – such as ```{first_name}``` or ```{last_name}```. Within a Text Layer, you can do arbitrary string concatenation such as ```{last_name}, {first_name}```. The plugin's "Populate with …" command will replace all these placeholders with respective data.

2. In the same Layer Group, create a Rectangle Layer (this is your image placeholder). Give the Rectangle Layer a placeholder name in curly brackets – such as ```{avatar_image}```. The plugin's "Populate with …" command will replace this placeholders with respective image data.

### All available Commands:

**Populate with JSON** will ask you to choose a JSON file that can sit anywhere on your Computer. After picking a JSON, you can choose the following options: _Randomize data order_, _Trim overflowing Text (fixed width text layers)_ and _Insert ellipsis after trimmed text_ (selected options will be preserved):

![Populate with JSON](populate-with-json-dialog.png)

**Populate with Preset** will display a dialog that allows you to select one of your Presets as well as the aforementioned options:

![Populate with Preset](populate-with-preset-dialog.png)

**Reveal Presets** will point you into the plugin's location for its Presets. Presets are simply JSON files and folders with image assets that live inside the plugin bundle. In there, you can use any desired folder structure.

**Populate again** populates the selection with the last used Preset/JSON and options configuration.

---

Check out the **demo.sketch** and **demo-population.sketch** files in the **demo** folder to get an idea.

---

### Data format & assets

The data need to be stored in JSON files that can be loaded by the plugin from either the Presets Folder (Populate with Preset) or from any folder on your computer (Populate with JSON). The data in JSON need to be in an array like in this example:

```[
  {
    "id": 1,
    "first_name": "Willie",
    "last_name": "Willis",
    "company_name": "Myworks",
    "job_title": "Marketing Assistant",
    "email": "wwillis0@cdc.gov",
    "phone": "9-(528)011-1428",
    "street_address": "99 Hallows Terrace",
    "city": "Outeiro",
    "country": "Portugal",
    "avatar_image": "assets/1.jpg"
  },
  {
    "id": 2,
    "first_name": "Melissa",
    "last_name": "Flores",
    "company_name": "Tagtune",
    "job_title": "Actuary",
    "email": "mflores1@jigsy.com",
    "phone": "4-(965)937-9250",
    "street_address": "46 Acker Trail",
    "city": "Santiago",
    "country": "Philippines",
    "avatar_image": "assets/2.jpg"
  }, …
```

Note that in the example the image files are referenced from a folder called _assets_. This means all your image data should be placed inside a folder that sits on the same level as your JSON file. The images folder as well as your images can be named anything you like, you just need to reference them relative to your JSON file.

<sup>The mock data in "demo" were created with https://www.mockaroo.com, which is a pretty powerful tool to generate all kinds of data. The "products" images are from apple.com, the "contacts" images from https://randomuser.me/.</sup>
