import { Request, Response } from "express";
import routable from "../../decorators/routable.decorator";
import dgmAttributeTypes from "../../models/sde/dgmAttributeTypes.model";
import dgmTypeAttributes from "../../models/sde/dgmTypeAttributes.model";
import invCategories from "../../models/sde/invCategories.model";
import invGroups from "../../models/sde/invGroups.model";
import invMarketGroups from "../../models/sde/invMarketGroups.model";
import invTraits from "../../models/sde/invTraits.model";
import invTypes from "../../models/sde/invTypes.model";
import { DbUtilities as DB } from "../../utilities/db-utilities";

export default class itemTypesController {
    public static tags: string[] = ["Aggregates"];

    @routable({
        path: "/items/",
        method: "get",
        swagger: {
            tags: ["invTypes"],
            summary:
                "Provides more complete aggregated data about the supplied item type(s).",
            description: "",
            parameters: [
                {
                    name: "typeId",
                    description: "typeId of items",
                    in: "query",
                    required: true,
                    type: "array",
                    items: {
                        type: "integer",
                    },
                },
            ],
            responses: {
                "200": {
                    description: "An aggregate item",
                    properties: {
                        typeId: { type: "integer" },
                        name: { type: "string" },
                        group: { type: "object" },
                        marketGroup: { type: "object" },
                        volume: { type: "integer" },
                        mass: { type: "integer", required: false },
                        description: { type: "string" },
                    },
                },
                "400": {
                    description: "Not Found",
                },
                "420": {
                    description: "Rate Limited",
                },
            },
        },
    })
    public async getItemType(req: Request, res: Response) {
        if (!req.query.typeId) {
            return;
        }

        let requestedIds: number[] = (req.query.typeId as string)
            .split(",")
            .map((i) => parseInt(i));

        const results: itemAggregate[] = [];

        for (const rId of requestedIds) {
            let item: itemAggregate = {} as itemAggregate;
            const invType = (
                await DB.Query(
                    { [invTypes._idField]: rId },
                    invTypes.getFactory()
                )
            )[0];

	    const group = (
	                await DB.Query(
	                    {
        	                [invGroups._idField]: invType.groupID,
	                    },
                	    invGroups.getFactory()
        	        )
	            )[0];
            let marketGroup;
            if (typeof invType.marketGroupID !== "number") {
                marketGroup = (
                    await DB.Query(
                        { [invMarketGroups._idField]: invType.marketGroupID },
                        invMarketGroups.getFactory()
                    )
                )[0];
            }
            const groupCategory = (
                await DB.Query(
                    { categoryID: group.categoryID },
                    invCategories.getFactory()
                )
            )[0];
            const traits = await DB.Query(
                { typeID: rId },
                invTraits.getFactory()
            );

            item.typeId = rId;
            item.name = invType.typeName;
            item.group = {
                groupId: invType.groupID,
                name: group.groupName,
            };
            if (marketGroup) {
                item.marketGroup = {
                    marketGroupId: invType.marketGroupID,
                    name: marketGroup.marketGroupName,
                };
            }
            item.volume = invType.volume;
            item.mass = invType.mass;
            item.description = invType.description;
            item.type = groupCategory.categoryName;
            item.traits = traits;

            results.push(item);
        }

        res.status(200).send(results);
    }

    @routable({
        path: "/items/attributes/",
        method: "get",
        swagger: {
            tags: ["invTypes"],
            summary: "Provides attributes for the supplied item type(s).",
            description: "",
            parameters: [
                {
                    name: "typeId",
                    description: "typeId of items",
                    in: "query",
                    required: true,
                    type: "array",
                    items: {
                        type: "integer",
                    },
                },
            ],
            responses: {
                "200": {
                    description: "An aggregate item",
                    properties: {
                        typeId: { type: "integer" },
                        attributes: { type: "array" },
                    },
                },
                "400": {
                    description: "Not Found",
                },
                "420": {
                    description: "Rate Limited",
                },
            },
        },
    })
    public async getItemTypeAttributes(req: Request, res: Response) {
        if (!req.query.typeId) {
            return;
        }

        let requestedIds: number[] = (req.query.typeId as string)
            .split(",")
            .map((i) => parseInt(i));

        const results: {
            typeId: number;
            attributes: dogmaAttribute[];
        }[] = [];

        for (const rId of requestedIds) {
            let item: {
                typeId: number;
                attributes: dogmaAttribute[];
            } = {} as {
                typeId: number;
                attributes: dogmaAttribute[];
            };

            const attribs = await DB.Query(
                {
                    typeID: rId,
                },
                dgmTypeAttributes.getFactory()
            );
            const attribTypes = (
                await DB.Query(
                    {
                        $or: attribs.map((a) => {
                            return { attributeID: a.attributeID };
                        }),
                    },
                    dgmAttributeTypes.getFactory()
                )
            ).filter(
                (a: dgmAttributeTypes) =>
                    a.attributeName.toLowerCase() !== "none"
            );

            item.typeId = rId;
            item.attributes = attribTypes.map((t) => {
                return {
                    attributeName: t.attributeName,
                    attributeDescription: t.description,
                    attributeIconID: t.iconID,
                    value:
                        attribs.find((a) => a.attributeID === t.attributeID)
                            ?.valueFloat ?? 0,
                } as dogmaAttribute;
            });

            results.push(item);
        }

        res.status(200).send(results);
    }
}

interface itemAggregate {
    typeId: number;
    name: string;
    group: {
        groupId: number;
        name: string;
    };
    marketGroup: {
        marketGroupId: number;
        name: string;
    };
    volume: number;
    mass: number;
    description: string;
    traits: invTraits[];
    type: string;
}

interface dogmaAttribute {
    attributeName: string;
    attributeDescription: string;
    attributeIconID: number;
    value: number;
}
[];
