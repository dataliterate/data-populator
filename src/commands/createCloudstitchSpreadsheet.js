/**
 * Create Spreadsheet
 *
 * Opens up a new Cloudstitch project for cloning
 */
import Context from '../context'
import * as Layers from '../library/layers'
import * as Populator from '../library/populator'

export default (context) => {
  Context(context)
  var url = NSURL.URLWithString("https://www.cloudstitch.com/project-templates/sketch-data/clone"); 
  log(url);
  NSWorkspace.sharedWorkspace().openURL(url);  
}