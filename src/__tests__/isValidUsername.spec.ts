import { isValidUsername } from "../server";

describe("isValidUsername", () => {
    [
        "TRE5huj%",
        "GV",
        "76890",
        "_hujikrulovs",
    ].forEach(userName =>
        it(`should not be valid user name: ${userName}`, () => {
            expect(isValidUsername(userName)).toBe(false);
        })
    );

    [
        "TRE5huj",
        "Gumpag_2001",
        "drAkis",
        "Pompapdoodlessdjkjks",
    ].forEach(userName =>
        it(`should be valid user name: ${userName}`, () => {
            expect(isValidUsername(userName)).toBe(true);
        })
    );
});
