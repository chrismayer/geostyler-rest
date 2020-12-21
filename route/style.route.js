/**
 * REST routes for styles
 *
 * @author C. Mayer (meggsimum)
 */
module.exports = function (app) {
  const basePath = '/geostyler-rest/rpc/transform';

  /**
   * Uses GeoStyler to convert between various formats for styling of geographic data.
   */
  app.post(basePath, (req, res) => {
    const sourceStyle = req.body;

    console.log(sourceStyle);

    if (!sourceStyle || sourceStyle === '') {
      res.status(400).json({ msg: 'error', details: 'No source style style given in POST body.' });
    }

    const sourceFormat = req.query.sourceFormat;
    const targetFormat = req.query.targetFormat;

    if (!sourceFormat && !targetFormat) {
      res.status(400).json({ msg: 'error', details: 'URL param "sourceFormat" or "targetFormat" is missing.' });
    }

    if (sourceFormat.toLowerCase() === targetFormat.toLowerCase()) {
      sendTargetStyle(sourceStyle, sourceFormat, res);
    }
    const sourceParser = getParserFromUrlParam(sourceFormat);
    const targetParser = getParserFromUrlParam(targetFormat);

    sourceParser.readStyle(sourceStyle)
      .then(gs => {
        targetParser.writeStyle(gs).then(function (targetStyle) {
          // send HTTP response
          sendTargetStyle(targetStyle, targetFormat, res);
        });
      }, (err) => {
        console.error(err);
        res.status(500).json({ msg: 'error', details: '' });
      });
  });
};

/**
 * Send the HTTP response for the target style object.
 *
 * @param {String} targetStyle Transformed style object in target format
 * @param {String} targetFormat Target content-type format, e.g. 'application/json'
 * @param {*} res The express response object
 */
const sendTargetStyle = (targetStyle, targetFormat, res) => {
  const targetType = getContentTypeFromUrlParam(targetFormat);

  res.type(targetType);

  if (targetType === 'application/xml' || targetType === 'text/plain') {
    res.status(200).send(targetStyle);
  } else if (targetType === 'application/json') {
    res.status(200).json(targetStyle);
  }
}

/**
 * Returns the corresponding parser instance for the given format from the URL.
 *
 * @param {String} paramVal Query param value for the format, e.g. 'qml'
 * @returns {*} GeoStyler Parser instance
 */
const getParserFromUrlParam = paramVal => {
  if (!paramVal) {
    return undefined;
  }

  const SldParser = require('geostyler-sld-parser').SldStyleParser;
  const MapboxParser = require('geostyler-mapbox-parser').MapboxStyleParser;
  const MapfileParser = require('geostyler-mapfile-parser').MapfileStyleParser;
  const QgisParser = require('geostyler-qgis-parser').QGISStyleParser;

  switch (paramVal.toLowerCase()) {
    case 'mapbox':
      return new MapboxParser();
    case 'map':
      return new MapfileParser();
    case 'sld':
      return new SldParser();
    case 'qml':
      return new QgisParser();
    default:
      return undefined;
  }
};

/**
 * Returns the corresponding content type for the given format from the URL.
 *
 * @param {String} paramVal Query param value for the format, e.g. 'qml'
 * @returns {String} Content-Type
 */
const getContentTypeFromUrlParam = paramVal => {
  if (!paramVal) {
    return undefined;
  }

  switch (paramVal.toLowerCase()) {
    case 'mapbox':
      return 'application/json'
    case 'map':
      return 'text/plain'
    case 'sld':
      return 'application/xml'
    case 'qml':
      return 'application/xml'
    default:
      return undefined;
  }
};
