import { Request, Response } from "express";
import routable from "../../decorators/routable.decorator";
import invCategories from "../../models/sde/invCategories.model";
import invGroups from "../../models/sde/invGroups.model";
import invMarketGroups from "../../models/sde/invMarketGroups.model";
import invTraits from "../../models/sde/invTraits.model";
import invTypes from "../../models/sde/invTypes.model";
import { DbUtilities as DB } from "../../utilities/db-utilities";

export default class mapController {
    public static tags: string[] = ["Aggregates"];

    @routable({
        path: "/map/",
        method: "get",
        // swagger: {
        //     tags: ["invTypes"],
        //     summary:
        //         "Provides more complete aggregated data about the supplied item type(s).",
        //     description: "",
        //     parameters: [
        //         {
        //             name: "typeId",
        //             description: "typeId of items",
        //             in: "query",
        //             required: true,
        //             type: "array",
        //             items: {
        //                 type: "integer",
        //             },
        //         },
        //     ],
        //     responses: {
        //         "200": {
        //             description: "An aggregate item",
        //             properties: {
        //                 typeId: { type: "integer" },
        //                 name: { type: "string" },
        //                 group: { type: "object" },
        //                 marketGroup: { type: "object" },
        //                 volume: { type: "integer" },
        //                 mass: { type: "integer", required: false },
        //                 description: { type: "string" },
        //             },
        //         },
        //         "400": {
        //             description: "Not Found",
        //         },
        //         "420": {
        //             description: "Rate Limited",
        //         },
        //     },
        // },
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
}
