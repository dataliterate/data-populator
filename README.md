![Sketch Data Populator](https://github.com/preciousforever/sketch-data-populator/raw/master/sketch-data-populator.png)

## Why Data Populator

We believe designers should work with _meaningful_ and _realistic_ data as early as possible in the design process for the following reasons:

1. **Content informs design decisions** (and helps you convey your purpose)
2. **Data are relentless** (so UI components must be designed for robustness)
3. **It's fun** (seeing your design evolve with meaningful data is motivating and rewarding)

_Sketch Data Populator_ not only makes you more productive (probably around [60x faster](https://vimeo.com/131896485)), it changes the way you design user interfaces (at least that's what happened to us).

## Testing & Credits

Please report bugs, observations, ideas & feature requests as [issues](https://github.com/preciousforever/sketch-data-populator/issues) or [get in touch](mailto:feedback@datapopulator.com).

We conceived _Sketch Data Populator_ to improve our design process for working with data at [precious design studio](http://precious-forever.com/) and developed the plugin in collaboration with [Lukas Ondrej](https://github.com/lukasondrej). Please get in touch if you have questions or comments via [@preciousforever](https://twitter.com/preciousforever) or [our website](http://precious-forever.com/contact).

## Installation
1. Download the ZIP file (or clone repository)
2. Move the file ```Sketch Data Populator.sketchplugin``` into your Sketch Plugins folder. In Sketch 3, choose **Plugins › Reveal Plugins Folder…** to open it.

## How to use …

The **Sketch Data Populator** plugin creates a grid from a selected element (Layer Group or Artboard) and replaces text and image {placeholders} with data from a JSON source:

![Sketch Data Populator](https://github.com/preciousforever/sketch-data-populator/raw/master/sketch-data-populator.gif)

### Here's how it works:

1. Create a Layer Group that contains at least one Text Layer. In these Text Layers, use placeholders for you data fields in curly brackets – such as ```{firstname}``` or ```{lastname}```. Within a Text Layer, you can do arbitrary string concatenation such as ```{lastname}, {firstname}```. The plugin's "Populate with …" command will replace all these placeholders with respective data.

2. In the same Layer Group, create a Shape Layer (this is your image placeholder). Give the Shape Layer a placeholder name in curly brackets – such as ```{image}```. The plugin's "Populate with …" command will replace this placeholder with respective image data (PNG, JPG).

### All available Commands:

#### Populate with JSON
will ask you to choose a JSON file that can sit anywhere on your Computer. After picking a JSON file you can configure Data and Layout options:

![Populate with JSON](https://github.com/preciousforever/sketch-data-populator/raw/master/populate-with-json-dialog.png)

#### Populate with Preset
will display a dialog that allows you to select one of your Presets as well as configure Data and Layout options:

![Populate with Preset](https://github.com/preciousforever/sketch-data-populator/raw/master/populate-with-preset-dialog.png)

**Data options**  
* _Randomize data order_: instead of going through the JSON top down row by row, it will pick a random data set.  
* _Trim overflowing text_: a Text Layer that has been set with a fixed width will trim overflowing text.  
* _Insert ellipsis after trimmed text_: will insert a "…" after the trimmed text.  
* _Default substitute_ (see below)  

**Handling missing data**  

_Text Substitutes_  
`{placeholder}` inserts an empty string if no data are available for placeholder  
`{placeholder?}` uses the _Default substitute_  
`{placeholder?substitute}` uses the custom substitute you append after the "?"

_Image Substitutes_  
If there's no image available, it will turn off the fill of the placeholder shape and turn it on again once there's data available when re-populating. So for images, it's recommended to put a substitute image or pictogram behind the actual image. So this will be visible if there's no actual image data (see "demo.sketch" for examples).

**"Join" function**  
Imagine you want to concatenate the keys _name_, _price_, _date_ and _time_ seperated by a `·` (interpunct/middle dot). Usually, you would create a string in a Text Layer like this:  
`{name} · {price} · {date} · {time}`

This works great as long as you have data for each key – like:  
`CursusId.jpeg · $1993.33 · 3.12.2014 · 2:29 PM`

But now imagine there's no data (or substitute) for _price_ and _time_. Which would lead to:  
`CursusId.jpeg ·  · 3.12.2014 · `

That's why there's now a "join" function with the following syntax to be used inside a {placeholder}:  
`{name,price,date,time|& · }`

1. comma separated list of keys
2. `|`
3. `&` followed by a delimiter, eg. ` · ` or `, ` (put _spaces_ where you need them!)

So in our above mentioned example, without data (or substitutes) for _price_ and _time_, it renders like this:  
`CursusId.jpeg · 3.12.2014`

Here's an animated example:
![join-enumeration](https://cloud.githubusercontent.com/assets/1927315/8994538/462cbae4-370c-11e5-82ca-79e1939a050d.gif)

**Layout options**  
If "Create grid" is checked, the plugin will create a grid from selected elements (Layer Groups or Artboards) and populate them in one go. Set the amount of rows and columns and the respective margins. This option works very similar to Sketch's "Make Grid" tool.

#### Populate again (⌘⇧X)
re-populates all selections with the last used Preset/JSON and options configuration. Great for "shuffling" through different data sets.

#### Restore Placeholders
restores populated Text Layers to their initial {placeholders}. An example: you used the placeholders "{firstname} {lastname}" in a Text Layer, they became "John Doe" after populating. "Restore Placeholders" will restore to "{firstname} {lastname}". This is useful because populating a Text Layer means the initially used {placeholders} will be persisted – so without restoring, it would always try to populate the initial {placeholders}, no matter what you type into the field.

#### Place image
will prompt you for picking an image on your computer and then use it as the background for the selected shape.

#### Reveal Presets
will point you into the plugin's location for its Presets. Presets are simply JSON files and folders with image assets that live inside the plugin bundle. In there, you can use any desired folder structure. To find the "Preset" folder inside the plugin bundle, right click _Sketch Data Populator.sketchplugin_ and select _Show Package Contents_.

---

Check out the **demo.sketch** file to get an idea.

---
## Additional Documentation

### Text placeholders (MSTextLayer)
    
    In layer name:
        - completely replaces the contents of the text layer
        - can be used for font icons
        - the name can contain other text, conditional actions, args, etc
        - only the first placeholder is considered if multiple exist
    
    In layer content:
        - each placeholder is treated as per usual
    
    Placeholder examples (usable in layer name and content): 
        - {firstName}, {name.first} - John
        - {firstName, lastName | & • } - John • Doe
        - {(lastName?, firstName | &, ), DOB | & born on } - Doe, John born on 14/07/1970
        - {firstName | upper} - JOHN
        - {firstName | upper | max 2} - JO
        - {(firstName | upper | max 2), (lastName | max 1) | & • } - JO • D
        - {keypath?} - The default substitute
        - {keypath?not available} - not available
        
    Args (standard CLI args):
        -l n - set n as the max number of lines in a fixed size text layer
        

### Image placeholders (MSShapeGroup, MSBitmapLayer)
    
    - sets the fill of the layer to the image (creates a new fill if needed, e.g. for a bitmap layer)
    
    Placeholder examples:
        - {avatarImage}
        - {avatar.image}
        
      
### Filters

    Filters are used via the pipe (|) operator and can be chained. Each filter has a name and an alias, e.g. join and &. More filters can be easily implemented.

      
### Conditional actions

    - actions that get executed based on a condition applicable to the specific layer
    - can be added to any layer (even text layers whose names contain a placeholder)
    
    Actions:
        - #show[condition] - shows layer if true and hides otherwise
        - #hide[condition] - hides layer if true and shows otherwise
        - #lock[condition] - locks layer if true and unlocks otherwise
        - #unlock[condition] - unlocks layer if true and locks otherwise
        - #delete[condition] - deletes the layer if the condition is true
        - #plugin[condition, command path] - runs the specified plugin command if condition is true
        
    Example actions:
        - #plugin["{name}".length > 2, Some Plugin > The Command]
