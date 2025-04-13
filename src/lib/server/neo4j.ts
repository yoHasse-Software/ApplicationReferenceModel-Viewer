
import neo4j, { type Config } from 'neo4j-driver';
import { Buffer } from "buffer";
import { NEO4J_USERNAME, NEO4J_PASSWORD, NEO4J_URL } from '$env/static/private';



export const driver = neo4j.driver(
    NEO4J_URL, 
    neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD));




