import React from 'react';
import {
  Card, CardImg, CardText, CardBody, Col,
  CardTitle, Button,
} from 'reactstrap';
import { Link } from 'react-router-dom';
import './CardFilm.scss';

const CardFilm = (props) => {
  const {
    name, imageUrl, url, videoUrl,
  } = props;
  return (
    <Card className="CardFilm">
      <Col className="photo-size">
        <CardImg top width="100%" src={imageUrl} alt="Card image cap" />
      </Col>
      <CardBody>
        <CardTitle>{name}</CardTitle>
        {/* <CardText>{onTheater}</CardText> */}
        <a href={url} target="_blank" rel="noopener noreferrer"><Button>More info</Button></a>
        <a href={videoUrl} target="_blank" rel="noopener noreferrer"><Button>Official Trailer</Button></a>
      </CardBody>
    </Card>
  );
};

export default CardFilm;
